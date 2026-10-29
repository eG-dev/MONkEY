import { afterNextRender, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { TranslocoDirective } from '@jsverse/transloco';

import { AccountsService } from '../../services/accounts/accounts.service';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { LanguageService } from '../../services/language/language.service';
import { AccountSummary } from '../../models/accounts/account-summary';
import { CurrencyAmountPipe } from '../../pipes/currency-amount/currency-amount.pipe';
import { AmountTonePipe } from '../../pipes/amount-tone/amount-tone.pipe';
import { ModalDialog } from '../modal-dialog/modal-dialog';
import { AccountAvatar } from '../account-avatar/account-avatar';

@Component({
  selector: 'app-accounts',
  imports: [FormsModule, RouterLink, TuiButton, TranslocoDirective, CurrencyAmountPipe, AmountTonePipe, ModalDialog, AccountAvatar],
  templateUrl: './accounts.html',
  styleUrl: './accounts.scss',
})
export class Accounts {
  protected readonly auth = inject(AuthenticationService);
  protected readonly language = inject(LanguageService);
  private readonly service = inject(AccountsService);
  private readonly router = inject(Router);

  protected readonly accounts = signal<AccountSummary[]>([]);
  protected readonly archivedAccounts = signal<AccountSummary[]>([]);
  protected readonly archivedLoading = signal(true);
  protected readonly archivedError = signal('');
  protected readonly loading = signal(false);
  protected readonly busy = signal(false);
  protected readonly interactive = signal(false);
  protected readonly error = signal('');
  protected readonly dialogError = signal('');
  protected readonly editing = signal<'new' | null>(null);
  protected readonly saved = signal('');

  protected name = '';

  constructor() {
    const initial = this.service.consume('/accounts');

    if (initial) {
      this.accounts.set(this.sorted(initial.accounts));
      this.error.set(initial.error);
    } else if (this.auth.isManager()) {
      void this.load();
    }

    afterNextRender(() => {
      this.interactive.set(true);

      if (this.auth.isManager()) {
        void this.loadArchived();
      }
    });
  }

  protected async loadArchived(): Promise<void> {
    this.archivedLoading.set(true);
    this.archivedError.set('');

    try {
      this.archivedAccounts.set(this.sorted(await this.service.archived()));
    } catch (failure: unknown) {
      this.archivedError.set(this.service.errorKey(failure));
    } finally {
      this.archivedLoading.set(false);
    }
  }

  protected deletionDate(account: AccountSummary): string {
    return account.purgeAtUtc
      ? new Intl.DateTimeFormat(this.language.locale(), { dateStyle: 'medium', timeZone: account.allowance.timezone }).format(
          new Date(account.purgeAtUtc),
        )
      : '';
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      this.accounts.set(this.sorted(await this.service.listSummaries()));
    } catch (failure: unknown) {
      this.accounts.set([]);
      this.error.set(this.service.errorKey(failure));
    } finally {
      this.loading.set(false);
    }
  }

  protected open(account: 'new'): void {
    this.name = '';
    this.dialogError.set('');
    this.saved.set('');
    this.editing.set(account);
  }

  protected close(): void {
    this.editing.set(null);
  }

  protected async save(): Promise<void> {
    const target = this.editing();
    const name = this.name.trim();

    if (!target || this.busy() || !this.interactive()) {
      return;
    }

    if (!name || name.length > 40) {
      this.dialogError.set('accounts.errors.invalid_account_name');
      return;
    }

    this.busy.set(true);
    this.dialogError.set('');

    try {
      const account = await this.service.create(name);

      this.editing.set(null);
      await this.router.navigate(['/accounts', account.id]);
    } catch (failure: unknown) {
      this.dialogError.set(this.service.errorKey(failure));
    } finally {
      this.busy.set(false);
    }
  }

  private sorted(accounts: AccountSummary[]): AccountSummary[] {
    return [...accounts].sort((first, second) => first.name.localeCompare(second.name, this.language.locale()));
  }
}
