import { afterNextRender, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton } from '@taiga-ui/core';
import { TranslocoDirective } from '@jsverse/transloco';

import { AuthenticationService } from '../../services/authentication/authentication.service';
import { UsersService } from '../../services/users/users.service';
import { UserAccount } from '../../models/authentication/user-account';
import { ModalDialog } from '../modal-dialog/modal-dialog';

type Dialog = 'create' | 'edit' | 'reset' | 'password' | null;

@Component({
  selector: 'app-users',
  imports: [FormsModule, TuiButton, TranslocoDirective, ModalDialog],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users {
  protected readonly auth = inject(AuthenticationService);
  private readonly service = inject(UsersService);

  protected readonly accounts = signal<UserAccount[]>([]);
  protected readonly loading = signal(false);
  protected readonly busy = signal(false);
  protected readonly interactive = signal(false);
  protected readonly error = signal('');
  protected readonly dialogError = signal('');
  protected readonly saved = signal('');
  protected readonly dialog = signal<Dialog>(null);
  protected readonly selected = signal<UserAccount | null>(null);
  protected readonly temporaryPassword = signal('');
  protected readonly copied = signal(false);
  protected readonly lastManager = computed(() => {
    const account = this.selected();
    const activeManagers = this.accounts().filter((entry) => entry.user.role === 'Manager' && entry.isActive).length;

    return Boolean(account && account.user.role === 'Manager' && account.isActive && activeManagers <= 1);
  });

  protected username = '';
  protected displayName = '';
  protected role: 'Manager' | 'Member' = 'Member';
  protected active = true;

  constructor() {
    afterNextRender(() => {
      this.interactive.set(true);

      if (this.auth.user()?.role === 'Manager') {
        void this.load();
      }
    });
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const accounts = await this.service.list();
      this.accounts.set(accounts.sort((first, second) => first.user.displayName.localeCompare(second.user.displayName)));
    } catch (failure: unknown) {
      this.error.set(this.auth.errorKey(failure));
    } finally {
      this.loading.set(false);
    }
  }

  protected openCreate(): void {
    this.username = '';
    this.displayName = '';
    this.role = 'Member';
    this.selected.set(null);
    this.open('create');
  }

  protected openEdit(account: UserAccount): void {
    this.displayName = account.user.displayName;
    this.role = account.user.role;
    this.active = account.isActive;
    this.selected.set(account);
    this.open('edit');
  }

  protected openReset(account: UserAccount): void {
    this.selected.set(account);
    this.open('reset');
  }

  protected close(): void {
    this.dialog.set(null);
  }

  protected async create(): Promise<void> {
    const username = this.username.trim();
    const displayName = this.displayName.trim();

    if (!username || username.length > 100 || !displayName || displayName.length > 100) {
      this.dialogError.set('auth.errors.invalid_user');
      return;
    }

    await this.run(async () => {
      const created = await this.service.create(username, displayName, this.role);
      this.selected.set({ user: created.user, isActive: true });
      this.showPassword(created.temporaryPassword);
    });
  }

  protected async update(): Promise<void> {
    const account = this.selected();
    const displayName = this.displayName.trim();

    if (!account) {
      return;
    }

    if (!displayName || displayName.length > 100) {
      this.dialogError.set('auth.errors.invalid_user');
      return;
    }

    await this.run(async () => {
      await this.service.update(account.user.id, displayName, this.role, this.active);

      if (account.user.id === this.auth.user()?.id) {
        location.reload();
        return;
      }

      this.dialog.set(null);
      this.saved.set(displayName);
    });
  }

  protected async reset(): Promise<void> {
    const account = this.selected();

    if (!account) {
      return;
    }

    await this.run(async () => {
      const result = await this.service.resetPassword(account.user.id);

      if (account.user.id === this.auth.user()?.id) {
        location.reload();
        return;
      }

      this.showPassword(result.temporaryPassword);
    });
  }

  protected async copyPassword(): Promise<void> {
    await navigator.clipboard.writeText(this.temporaryPassword());
    this.copied.set(true);
  }

  protected finishPassword(): void {
    this.temporaryPassword.set('');
    this.dialog.set(null);
  }

  protected toggleActive(): void {
    this.active = !this.active;
  }

  private open(dialog: Dialog): void {
    this.dialogError.set('');
    this.saved.set('');
    this.dialog.set(dialog);
  }

  private showPassword(password: string): void {
    this.temporaryPassword.set(password);
    this.copied.set(false);
    this.dialog.set('password');
  }

  private async run(action: () => Promise<void>): Promise<void> {
    if (this.busy() || !this.interactive()) {
      return;
    }

    this.busy.set(true);
    this.dialogError.set('');

    try {
      await action();
      await this.load();
    } catch (failure: unknown) {
      this.dialogError.set(this.auth.errorKey(failure));
    } finally {
      this.busy.set(false);
    }
  }
}
