import { afterNextRender, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { TranslocoDirective } from '@jsverse/transloco';

import { AccountsService } from './accounts.service';
import { AuthenticationService } from './authentication.service';
import { SharedAccount } from './shared-account';

@Component({
  selector: 'app-account-details',
  imports: [FormsModule, RouterLink, TuiButton, TranslocoDirective],
  templateUrl: './account-details.html',
  styleUrl: './accounts.scss',
})
export class AccountDetails {
  protected readonly auth = inject(AuthenticationService);
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

  protected name = '';
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
    this.name = this.account()?.name ?? '';
    this.error.set('');
    this.saved.set(false);
    this.editing.set(true);
  }

  protected cancel(): void {
    this.editing.set(false);
    this.error.set('');
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
