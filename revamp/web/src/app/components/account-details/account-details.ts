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
import { LedgerEntry } from '../../models/accounts/ledger-entry';
import { LedgerHistory } from '../../models/accounts/ledger-history';
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
  protected readonly transaction = signal<'deposit' | 'withdrawal' | null>(null);
  protected readonly transactionSaved = signal(false);
  protected readonly history = signal<LedgerEntry[]>([]);
  protected readonly historyLoading = signal(true);
  protected readonly historyError = signal('');
  protected readonly historyPage = signal(0);
  protected readonly nextCursor = signal<string | null>(null);

  protected name = '';
  protected amount = '';
  protected comment = '';
  private openingKey = '';
  private openingPayload = '';
  private transactionKey = '';
  private transactionPayload = '';
  private historyPages: LedgerHistory[] = [];
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

    afterNextRender(() => {
      this.interactive.set(true);

      if (this.account()?.balance !== null) {
        void this.loadHistory();
      }
    });
  }

  protected edit(): void {
    this.opening.set(false);
    this.transaction.set(null);
    this.name = this.account()?.name ?? '';
    this.error.set('');
    this.saved.set(false);
    this.editing.set(true);
  }

  protected cancel(): void {
    this.editing.set(false);
    this.opening.set(false);
    this.transaction.set(null);
    this.error.set('');
  }

  protected beginOpening(): void {
    this.editing.set(false);
    this.opening.set(true);
    this.error.set('');
    this.openingSaved.set(false);
  }

  protected beginTransaction(source: 'deposit' | 'withdrawal'): void {
    this.editing.set(false);
    this.opening.set(false);
    this.transaction.set(source);
    this.transactionSaved.set(false);
    this.error.set('');
    this.amount = '';
    this.comment = '';
  }

  protected async postTransaction(): Promise<void> {
    const account = this.account();
    const source = this.transaction();

    if (!account || account.balance === null || !source || this.busy() || !this.interactive()) {
      return;
    }

    const amount = this.canonicalAmount(this.amount, false);

    if (!amount || amount === '0.00') {
      this.error.set('accounts.errors.invalid_transaction_amount');
      return;
    }

    const comment = this.comment.trim();
    const payload = JSON.stringify({ accountId: account.id, source, amount, comment });

    if (payload !== this.transactionPayload) {
      this.transactionPayload = payload;
      this.transactionKey = crypto.randomUUID();
    }

    this.busy.set(true);
    this.error.set('');

    try {
      await this.service.postTransaction(account.id, source, amount, comment, this.transactionKey);

      if (this.account()?.id === account.id) {
        this.transaction.set(null);
        this.transactionSaved.set(true);
        this.transactionPayload = '';
        const refreshed = await this.service.find(account.id);

        if (this.account()?.id === account.id) {
          this.account.set(refreshed);
          await this.loadHistory();
        }
      }
    } catch (failure: unknown) {
      this.error.set(this.service.errorKey(failure));
    } finally {
      this.busy.set(false);
    }
  }

  protected async nextHistory(): Promise<void> {
    const cursor = this.nextCursor();

    if (cursor && !this.historyLoading()) {
      await this.loadHistory(cursor, this.historyPage() + 1);
    }
  }

  protected async previousHistory(): Promise<void> {
    const page = this.historyPage() - 1;
    const cached = this.historyPages[page];

    if (cached && !this.historyLoading()) {
      this.history.set(cached.entries);
      this.nextCursor.set(cached.nextCursor);
      this.historyPage.set(page);
      this.historyError.set('');
    }
  }

  protected async postOpening(): Promise<void> {
    const account = this.account();

    if (!account || account.balance !== null || this.busy() || !this.interactive()) {
      return;
    }

    const amount = this.canonicalAmount(this.amount, true);

    if (amount === null) {
      this.error.set('accounts.errors.invalid_opening_amount');
      return;
    }

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
        await this.loadHistory();
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
    this.transaction.set(null);
    this.transactionSaved.set(false);
    this.history.set([]);
    this.historyError.set('');
    this.nextCursor.set(null);
    this.historyPage.set(0);
    this.historyPages = [];
    this.error.set('');
    this.saved.set(false);

    try {
      const account = await this.service.find(id);

      if (id === this.loadedId) {
        this.account.set(account);

        if (this.interactive() && account.balance !== null) {
          await this.loadHistory();
        }
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

  private canonicalAmount(value: string, signed: boolean): string | null {
    const decimal = new Intl.NumberFormat(this.language.locale()).formatToParts(1.1).find((part) => part.type === 'decimal')?.value ?? '.';
    const input = value.trim();
    const canonical = input.replace(decimal, '.');

    if (
      (decimal !== '.' && input.includes('.')) ||
      !/^-?[0-9]{1,17}(?:\.[0-9]{1,2})?$/.test(canonical) ||
      (!signed && canonical.startsWith('-'))
    ) {
      return null;
    }

    const negative = canonical.startsWith('-');
    const [whole, fraction = ''] = (negative ? canonical.slice(1) : canonical).split('.');
    const magnitude = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));

    if (magnitude > (negative ? 9223372036854775808n : 9223372036854775807n)) {
      return null;
    }

    return `${negative && magnitude !== 0n ? '-' : ''}${magnitude / 100n}.${(magnitude % 100n).toString().padStart(2, '0')}`;
  }

  private async loadHistory(cursor: string | null = null, page = 0): Promise<void> {
    const id = this.account()?.id;

    if (!id) {
      return;
    }

    this.historyLoading.set(true);
    this.historyError.set('');

    try {
      const result = await this.service.history(id, cursor);

      if (this.account()?.id === id) {
        this.history.set(result.entries);
        this.nextCursor.set(result.nextCursor);
        this.historyPage.set(page);

        if (page === 0 && cursor === null) {
          this.historyPages = [];
        }

        this.historyPages[page] = result;
      }
    } catch (failure: unknown) {
      if (this.account()?.id === id) {
        this.historyError.set(this.service.errorKey(failure));
      }
    } finally {
      if (this.account()?.id === id) {
        this.historyLoading.set(false);
      }
    }
  }
}
