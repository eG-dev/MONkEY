import { afterNextRender, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { TranslocoDirective } from '@jsverse/transloco';

import { AccountsService } from '../../services/accounts/accounts.service';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { LanguageService } from '../../services/language/language.service';
import { SharedAccount } from '../../models/accounts/shared-account';
import { CurrencyAmountPipe } from '../../pipes/currency-amount/currency-amount.pipe';
import { AmountTonePipe } from '../../pipes/amount-tone/amount-tone.pipe';
import { AccountAvatar } from '../account-avatar/account-avatar';

@Component({
  selector: 'app-overview',
  imports: [RouterLink, TuiButton, TranslocoDirective, CurrencyAmountPipe, AmountTonePipe, AccountAvatar],
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
})
export class Overview {
  protected readonly auth = inject(AuthenticationService);
  protected readonly language = inject(LanguageService);
  private readonly service = inject(AccountsService);

  protected readonly accounts = signal<SharedAccount[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly interactive = signal(false);

  constructor() {
    const initial = this.service.consume('/accounts');

    if (initial) {
      this.accounts.set(this.sorted(initial.accounts));
      this.error.set(initial.error);
    } else {
      void this.load();
    }

    afterNextRender(() => this.interactive.set(true));
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      this.accounts.set(this.sorted(await this.service.list()));
    } catch (failure: unknown) {
      this.accounts.set([]);
      this.error.set(this.service.errorKey(failure));
    } finally {
      this.loading.set(false);
    }
  }

  private sorted(accounts: SharedAccount[]): SharedAccount[] {
    return [...accounts].sort((first, second) => first.name.localeCompare(second.name, this.language.locale()));
  }
}
