import { afterNextRender, Component, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { TranslocoDirective } from '@jsverse/transloco';

import { AccountsService } from '../../services/accounts/accounts.service';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { SharedAccount } from '../../models/accounts/shared-account';
import { CurrencyAmountPipe } from '../../pipes/currency-amount/currency-amount.pipe';
import { LanguageService } from '../../services/language/language.service';

@Component({
  selector: 'app-account-details',
  imports: [FormsModule, RouterLink, TuiButton, TranslocoDirective, CurrencyAmountPipe, DatePipe],
  templateUrl: './account-details.html',
  styleUrl: './account-details.scss',
})
export class AccountDetails {
  protected readonly auth = inject(AuthenticationService);
  protected readonly language = inject(LanguageService);
  private readonly service = inject(AccountsService);
  private readonly route = inject(ActivatedRoute);
  private readonly parameters = toSignal(this.route.paramMap);

  protected readonly account = signal<SharedAccount | null>(null);
  protected readonly loading = signal(false);
  protected readonly busy = signal(false);
  protected readonly interactive = signal(false);
  protected readonly editing = signal(false);
  protected readonly error = signal('');
  protected readonly saved = signal(false);
  protected readonly opening = signal(false);
  protected readonly openingSaved = signal(false);

  protected name = '';
  protected amount = '';
  protected comment = '';
  private openingKey = '';
  private openingPayload = '';
  private loadedId: string | null = null;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    const initial = this.service.consume(`/accounts/${id}`);

    if (initial) {
      this.loadedId = id;
      this.account.set(initial.account);
      this.error.set(initial.error);
    }

    effect(() => {
      const currentId = this.parameters()?.get('id');

      if (currentId && currentId !== this.loadedId) {
        this.loadedId = currentId;
        void this.load(currentId);
      }
    });

    afterNextRender(() => this.interactive.set(true));
  }

  protected edit(): void {
    this.opening.set(false);
    this.name = this.account()?.name ?? '';
    this.error.set('');
    this.saved.set(false);
    this.editing.set(true);
  }

  protected cancel(): void {
    this.editing.set(false);
    this.opening.set(false);
    this.error.set('');
  }

  protected beginOpening(): void {
    this.editing.set(false);
    this.opening.set(true);
    this.error.set('');
    this.openingSaved.set(false);
  }

  protected async postOpening(): Promise<void> {
    const account = this.account();

    if (!account || account.balance !== null || this.busy() || !this.interactive()) {
      return;
    }

    const decimal = new Intl.NumberFormat(this.language.locale()).formatToParts(1.1).find((part) => part.type === 'decimal')?.value ?? '.';
    const input = this.amount.trim();
    const canonical = input.replace(decimal, '.');

    if ((decimal !== '.' && input.includes('.')) || !/^[0-9]{1,17}(?:\.[0-9]{1,2})?$/.test(canonical)) {
      this.error.set('accounts.errors.invalid_opening_amount');
      return;
    }

    const [whole, fraction = ''] = canonical.split('.');
    const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));

    if (cents > 9223372036854775807n) {
      this.error.set('accounts.errors.invalid_opening_amount');
      return;
    }

    const amount = `${cents / 100n}.${(cents % 100n).toString().padStart(2, '0')}`;
    const comment = this.comment.trim();
    const payload = JSON.stringify({ accountId: account.id, amount, comment });

    if (payload !== this.openingPayload) {
      this.openingPayload = payload;
      this.openingKey = crypto.randomUUID();
    }

    this.busy.set(true);
    this.error.set('');

    try {
      const entry = await this.service.postOpening(account.id, amount, comment, this.openingKey);

      if (this.account()?.id === account.id) {
        this.account.set({ ...account, balance: entry.amount, currency: entry.currency, openingEntry: entry });
        this.opening.set(false);
        this.openingSaved.set(true);
      }
    } catch (failure: unknown) {
      this.error.set(this.service.errorKey(failure));
    } finally {
      this.busy.set(false);
    }
  }

  protected async reload(): Promise<void> {
    if (this.loadedId) {
      await this.load(this.loadedId);
    }
  }

  protected async update(): Promise<void> {
    const account = this.account();

    if (!account || this.busy() || !this.interactive()) {
      return;
    }

    const name = this.name.trim();

    if (!name || name.length > 40) {
      this.error.set('accounts.errors.invalid_account_name');
      return;
    }

    this.busy.set(true);
    this.error.set('');
    this.saved.set(false);

    try {
      this.account.set(await this.service.update(account.id, name));
      this.editing.set(false);
      this.saved.set(true);
    } catch (failure: unknown) {
      this.error.set(this.service.errorKey(failure));
    } finally {
      this.busy.set(false);
    }
  }

  private async load(id: string): Promise<void> {
    this.account.set(null);
    this.loading.set(true);
    this.editing.set(false);
    this.opening.set(false);
    this.openingSaved.set(false);
    this.error.set('');
    this.saved.set(false);

    try {
      const account = await this.service.find(id);

      if (id === this.loadedId) {
        this.account.set(account);
      }
    } catch (failure: unknown) {
      if (id === this.loadedId) {
        this.error.set(this.service.errorKey(failure));
      }
    } finally {
      if (id === this.loadedId) {
        this.loading.set(false);
      }
    }
  }
}
