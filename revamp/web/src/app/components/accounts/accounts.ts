import { afterNextRender, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { TranslocoDirective } from '@jsverse/transloco';

import { AccountsService } from '../../services/accounts/accounts.service';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { SharedAccount } from '../../models/accounts/shared-account';
import { CurrencyAmountPipe } from '../../pipes/currency-amount/currency-amount.pipe';
import { LanguageService } from '../../services/language/language.service';

@Component({
  selector: 'app-accounts',
  imports: [FormsModule, RouterLink, TuiButton, TranslocoDirective, CurrencyAmountPipe],
  templateUrl: './accounts.html',
  styleUrl: './accounts.scss',
})
export class Accounts {
  protected readonly auth = inject(AuthenticationService);
  protected readonly language = inject(LanguageService);
  private readonly service = inject(AccountsService);
  private readonly router = inject(Router);

  protected readonly accounts = signal<SharedAccount[]>([]);
  protected readonly loading = signal(false);
  protected readonly busy = signal(false);
  protected readonly interactive = signal(false);
  protected readonly creating = signal(false);
  protected readonly error = signal('');

  protected name = '';

  constructor() {
    const initial = this.service.consume('/accounts');

    if (initial) {
      this.accounts.set(initial.accounts);
      this.error.set(initial.error);
    } else if (this.auth.user() && !this.auth.user()?.mustChangePassword) {
      void this.load();
    }

    afterNextRender(() => this.interactive.set(true));
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      this.accounts.set(await this.service.list());
    } catch (failure: unknown) {
      this.accounts.set([]);
      this.error.set(this.service.errorKey(failure));
    } finally {
      this.loading.set(false);
    }
  }

  protected cancel(): void {
    this.creating.set(false);
    this.name = '';
    this.error.set('');
  }

  protected async create(): Promise<void> {
    if (this.busy() || !this.interactive()) {
      return;
    }

    const name = this.name.trim();

    if (!name || name.length > 40) {
      this.error.set('accounts.errors.invalid_account_name');
      return;
    }

    this.busy.set(true);
    this.error.set('');

    try {
      const account = await this.service.create(name);

      await this.router.navigate(['/accounts', account.id]);
    } catch (failure: unknown) {
      this.error.set(this.service.errorKey(failure));
    } finally {
      this.busy.set(false);
    }
  }
}
