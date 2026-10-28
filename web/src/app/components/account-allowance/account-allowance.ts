import { afterNextRender, Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton } from '@taiga-ui/core';
import { TranslocoDirective } from '@jsverse/transloco';

import { SharedAccount } from '../../models/accounts/shared-account';
import { AllowanceState } from '../../models/accounts/allowance-state';
import { AllowanceExecution } from '../../models/accounts/allowance-execution';
import { AccountsService } from '../../services/accounts/accounts.service';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { LanguageService } from '../../services/language/language.service';
import { CurrencyAmountPipe } from '../../pipes/currency-amount/currency-amount.pipe';
import { ModalDialog } from '../modal-dialog/modal-dialog';

@Component({
  selector: 'app-account-allowance',
  imports: [FormsModule, TuiButton, TranslocoDirective, CurrencyAmountPipe, ModalDialog],
  templateUrl: './account-allowance.html',
  styleUrl: './account-allowance.scss',
})
export class AccountAllowance {
  readonly account = input.required<SharedAccount>();
  protected readonly auth = inject(AuthenticationService);
  protected readonly language = inject(LanguageService);
  private readonly service = inject(AccountsService);
  protected readonly state = signal<AllowanceState | null>(null);
  protected readonly interactive = signal(false);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly editing = signal(false);
  protected readonly error = signal('');
  protected readonly formError = signal('');
  protected readonly saved = signal(false);
  protected enabled = false;
  protected amount = '';
  private expectedRevisionId: string | null = null;

  constructor() {
    afterNextRender(() => this.interactive.set(true));
    effect(() => {
      const id = this.account().id;

      if (this.interactive()) {
        void this.load(id);
      }
    });
  }

  protected async load(id = this.account().id): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const state = await this.service.allowance(id);

      if (this.account().id === id) {
        this.state.set(state);
      }
    } catch (failure: unknown) {
      if (this.account().id === id) {
        this.error.set(this.service.errorKey(failure));
      }
    } finally {
      if (this.account().id === id) {
        this.loading.set(false);
      }
    }
  }

  protected month(value: string): string {
    return new Intl.DateTimeFormat(this.language.locale(), {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${value}-01T12:00:00Z`));
  }

  protected timestamp(value: string): string {
    return new Intl.DateTimeFormat(this.language.locale(), {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: this.state()?.timezone ?? 'UTC',
    }).format(new Date(value));
  }

  protected isCatchUp(execution: AllowanceExecution): boolean {
    if (!execution.creditedAtUtc) {
      return false;
    }

    const parts = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      timeZone: this.state()?.timezone ?? 'UTC',
    }).formatToParts(new Date(execution.creditedAtUtc));
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;

    return execution.businessMonth !== `${year}-${month}`;
  }

  protected open(): void {
    const state = this.state();

    if (!state || this.account().purgeAtUtc || !this.auth.isManager() || this.busy() || !this.interactive()) {
      return;
    }

    const configuration = state.scheduled ?? state.current;
    this.enabled = configuration?.enabled ?? false;
    const separator =
      new Intl.NumberFormat(this.language.locale()).formatToParts(1.1).find((part) => part.type === 'decimal')?.value ?? '.';
    this.amount = configuration?.amount?.replace('.', separator) ?? '';
    this.expectedRevisionId = state.latestRevisionId;
    this.formError.set('');
    this.saved.set(false);
    this.editing.set(true);
  }

  protected async save(): Promise<void> {
    if (this.account().purgeAtUtc || this.busy() || !this.interactive() || !this.auth.isManager()) {
      return;
    }

    const id = this.account().id;
    const separator =
      new Intl.NumberFormat(this.language.locale()).formatToParts(1.1).find((part) => part.type === 'decimal')?.value ?? '.';
    const amount = this.enabled ? this.amount.trim().replace(separator, '.') : null;
    this.busy.set(true);
    this.formError.set('');

    try {
      const state = await this.service.configureAllowance(id, this.enabled, amount, this.expectedRevisionId);

      if (this.account().id === id) {
        this.state.set(state);
        this.saved.set(true);
        this.editing.set(false);
      }
    } catch (failure: unknown) {
      this.formError.set(this.service.errorKey(failure));
    } finally {
      this.busy.set(false);
    }
  }
}
