import { afterNextRender, Component, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { TuiButton } from '@taiga-ui/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { firstValueFrom, timeout } from 'rxjs';

import { AuthenticationService } from './authentication.service';
import { UserAccount } from './user-account';

@Component({
  selector: 'app-authentication',
  imports: [FormsModule, TuiButton, TranslocoDirective],
  templateUrl: './authentication.html',
  styleUrl: './authentication.scss',
})
export class Authentication {
  protected readonly auth = inject(AuthenticationService);
  private readonly http = inject(HttpClient);

  protected readonly busy = signal(false);
  protected readonly interactive = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly accounts = signal<UserAccount[]>([]);
  protected readonly selected = signal<UserAccount | null>(null);

  protected username = '';
  protected password = '';
  protected currentPassword = '';
  protected newPassword = '';
  protected createUsername = '';
  protected createDisplayName = '';
  protected createPassword = '';
  protected createRole = 'Member';
  protected resetPassword = '';

  constructor() {
    afterNextRender(() => {
      this.interactive.set(true);

      if (this.auth.user()?.role === 'Manager' && !this.auth.user()?.mustChangePassword) {
        void this.run(() => this.refreshAccounts());
      }
    });
  }

  protected async login(): Promise<void> {
    await this.run(async () => {
      await this.auth.login(this.username, this.password);
      location.reload();
    });
    this.password = '';
  }

  protected async logout(): Promise<void> {
    await this.run(async () => {
      await this.auth.logout();
      location.reload();
    });
  }

  protected async changePassword(): Promise<void> {
    await this.run(async () => {
      await this.auth.write('POST', '/api/auth/password', { currentPassword: this.currentPassword, newPassword: this.newPassword });
      this.auth.user.set(null);
      this.accounts.set([]);
      this.selected.set(null);
      this.success.set('auth.passwordChanged');
    });
    this.currentPassword = '';
    this.newPassword = '';
  }

  protected async createUser(): Promise<void> {
    await this.run(async () => {
      await this.auth.write('POST', '/api/users', {
        username: this.createUsername,
        displayName: this.createDisplayName,
        password: this.createPassword,
        role: this.createRole,
      });
      this.createUsername = '';
      this.createDisplayName = '';
      this.success.set('auth.saved');
      await this.refreshAccounts();
    });
    this.createPassword = '';
  }

  protected selectUser(account: UserAccount): void {
    this.selected.set({ ...account, user: { ...account.user } });
    this.resetPassword = '';
    this.error.set('');
    this.success.set('');
  }

  protected async updateUser(): Promise<void> {
    const account = this.selected();

    if (!account) {
      return;
    }

    await this.run(async () => {
      await this.auth.write('PUT', `/api/users/${account.user.id}`, {
        displayName: account.user.displayName,
        role: account.user.role,
        isActive: account.isActive,
      });

      if (account.user.id === this.auth.user()?.id) {
        location.reload();
      } else {
        this.success.set('auth.saved');
        await this.refreshAccounts();
      }
    });
  }

  protected async resetUserPassword(): Promise<void> {
    const account = this.selected();

    if (!account) {
      return;
    }

    await this.run(async () => {
      await this.auth.write('POST', `/api/users/${account.user.id}/password`, { password: this.resetPassword });

      if (account.user.id === this.auth.user()?.id) {
        location.reload();
      } else {
        this.success.set('auth.saved');
        await this.refreshAccounts();
      }
    });
    this.resetPassword = '';
  }

  private async refreshAccounts(): Promise<void> {
    this.accounts.set(await firstValueFrom(this.http.get<UserAccount[]>('/api/users').pipe(timeout(5000))));
  }

  private async run(action: () => Promise<void>): Promise<void> {
    if (this.busy()) {
      return;
    }

    this.busy.set(true);
    this.error.set('');
    this.success.set('');

    try {
      await action();
    } catch (failure: unknown) {
      if (failure instanceof HttpErrorResponse && failure.status === 401) {
        this.auth.user.set(null);
        this.accounts.set([]);
        this.selected.set(null);
      }

      const codes = ['invalid_user', 'invalid_password', 'last_manager', 'csrf_invalid', 'invalid_language'];
      const payload: unknown = failure instanceof HttpErrorResponse ? failure.error : null;
      const code = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>)['code'] : null;
      const key =
        typeof code === 'string' && codes.includes(code)
          ? code
          : failure instanceof HttpErrorResponse && failure.status === 401
            ? 'unauthorized'
            : failure instanceof HttpErrorResponse && failure.status === 403
              ? 'forbidden'
              : failure instanceof HttpErrorResponse && failure.status === 429
                ? 'throttled'
                : 'unavailable';

      this.error.set(`auth.errors.${key}`);
    } finally {
      this.busy.set(false);
    }
  }
}
