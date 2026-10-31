import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { TranslocoDirective } from '@jsverse/transloco';

import { SharedAccount } from '../../models/accounts/shared-account';
import { UserAccount } from '../../models/authentication/user-account';
import { UserRole } from '../../models/authentication/user-role';
import { AccountsService } from '../../services/accounts/accounts.service';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { UsersService } from '../../services/users/users.service';
import { ModalDialog } from '../modal-dialog/modal-dialog';

@Component({
  selector: 'app-account-assignments',
  imports: [FormsModule, RouterLink, TuiButton, TranslocoDirective, ModalDialog],
  templateUrl: './account-assignments.html',
  styleUrl: './account-assignments.scss',
})
export class AccountAssignments {
  protected readonly auth = inject(AuthenticationService);
  private readonly users = inject(UsersService);
  private readonly accounts = inject(AccountsService);

  protected readonly rows = signal<{ member: UserAccount; accountIds: string[] }[]>([]);
  protected readonly available = signal<SharedAccount[]>([]);
  protected readonly selected = signal<UserAccount | null>(null);
  protected readonly selectedIds = signal<string[]>([]);
  protected readonly loading = signal(true);
  protected readonly dialogLoading = signal(false);
  protected readonly saving = signal(false);
  protected readonly interactive = signal(false);
  protected readonly error = signal('');
  protected readonly dialogError = signal('');
  protected readonly ready = signal(false);
  protected readonly saved = signal(false);
  private dialogRevision = 0;

  constructor() {
    afterNextRender(() => {
      this.interactive.set(true);

      if (this.auth.isManager()) {
        void this.load();
      } else {
        this.loading.set(false);
      }
    });
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const [users, accounts] = await Promise.all([this.users.list(), this.accounts.list()]);
      const members = users.filter((user) => user.user.role === UserRole.Member)
        .sort((first, second) => first.user.displayName.localeCompare(second.user.displayName));
      const rows = await Promise.all(members.map(async (member) => ({
        member,
        accountIds: await this.users.accountAssignments(member.user.id),
      })));
      this.available.set(this.sorted(accounts));
      this.rows.set(rows);
    } catch (failure: unknown) {
      this.auth.errorKey(failure);
      this.error.set('assignments.listFailed');
    } finally {
      this.loading.set(false);
    }
  }

  protected memberName(member: UserAccount): string {
    const name = member.user.displayName.trim().toLowerCase();
    const duplicate = this.rows().some((row) => row.member.user.id !== member.user.id &&
      row.member.user.displayName.trim().toLowerCase() === name);

    return duplicate ? `${member.user.displayName} (${member.user.username})` : member.user.displayName;
  }

  protected accountNames(accountIds: string[]): string {
    return this.available().filter((account) => accountIds.includes(account.id)).map((account) => account.name).join(', ');
  }

  protected open(member: UserAccount): void {
    this.selected.set(member);
    this.selectedIds.set([]);
    this.saved.set(false);
    void this.loadSelection();
  }

  protected close(): void {
    if (!this.saving()) {
      this.dialogRevision++;
      this.selected.set(null);
    }
  }

  protected async reload(): Promise<void> {
    if (this.dialogError() === 'assignments.notMember') {
      this.close();
      await this.load();
      return;
    }

    await this.loadSelection();
  }

  protected toggle(accountId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedIds.update((ids) => checked ? [...ids, accountId] : ids.filter((id) => id !== accountId));
  }

  protected async save(): Promise<void> {
    const member = this.selected();

    if (!member || !this.ready() || this.saving() || !this.interactive()) {
      return;
    }

    this.saving.set(true);
    this.ready.set(false);
    this.dialogError.set('');

    try {
      const accountIds = await this.users.replaceAccountAssignments(member.user.id, this.selectedIds());
      this.rows.update((rows) => rows.map((row) => row.member.user.id === member.user.id ? { ...row, accountIds } : row));
      this.selected.set(null);
      this.saved.set(true);
    } catch (failure: unknown) {
      this.auth.errorKey(failure);
      const code = this.errorCode(failure);
      this.dialogError.set(code === 'assignment_target_not_member'
        ? 'assignments.notMember'
        : code === 'account_not_assignable' || code === 'not_found'
          ? 'assignments.unavailable'
          : 'assignments.saveUnconfirmed');
    } finally {
      this.saving.set(false);
    }
  }

  private async loadSelection(): Promise<void> {
    const member = this.selected();

    if (!member) {
      return;
    }

    const revision = ++this.dialogRevision;
    this.dialogLoading.set(true);
    this.dialogError.set('');
    this.ready.set(false);

    try {
      const [accounts, accountIds] = await Promise.all([this.accounts.list(), this.users.accountAssignments(member.user.id)]);

      if (revision !== this.dialogRevision) {
        return;
      }

      this.available.set(this.sorted(accounts));
      this.selectedIds.set(accountIds);
      this.ready.set(true);
    } catch (failure: unknown) {
      if (revision !== this.dialogRevision) {
        return;
      }

      this.auth.errorKey(failure);
      this.dialogError.set(this.errorCode(failure) === 'assignment_target_not_member'
        ? 'assignments.notMember'
        : 'assignments.loadFailed');
    } finally {
      if (revision === this.dialogRevision) {
        this.dialogLoading.set(false);
      }
    }
  }

  private sorted(accounts: SharedAccount[]): SharedAccount[] {
    return [...accounts].sort((first, second) => first.name.localeCompare(second.name));
  }

  private errorCode(failure: unknown): string | null {
    const payload: unknown = failure instanceof HttpErrorResponse ? failure.error : null;

    return typeof payload === 'object' && payload !== null && 'code' in payload && typeof payload.code === 'string'
      ? payload.code
      : null;
  }
}