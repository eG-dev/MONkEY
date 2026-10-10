import { afterNextRender, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton } from '@taiga-ui/core';
import { TranslocoDirective } from '@jsverse/transloco';

import { AuthenticationService } from '../../services/authentication/authentication.service';
import { LanguageService } from '../../services/language/language.service';
import { LANGUAGES, LanguageId } from '../../i18n/languages';
import packageJson from '../../../../package.json';

@Component({
  selector: 'app-login',
  imports: [FormsModule, TuiButton, TranslocoDirective],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  protected readonly auth = inject(AuthenticationService);
  protected readonly language = inject(LanguageService);
  protected readonly languages = Object.values(LANGUAGES);
  protected readonly version = packageJson.version;

  protected readonly busy = signal(false);
  protected readonly interactive = signal(false);
  protected readonly error = signal('');
  protected readonly notice = signal(this.auth.notice() || (this.auth.expired() ? 'auth.sessionExpired' : ''));

  protected username = '';
  protected password = '';
  protected currentPassword = '';
  protected newPassword = '';

  constructor() {
    afterNextRender(() => this.interactive.set(true));
  }

  protected async chooseLanguage(language: LanguageId): Promise<void> {
    await this.language.choose(language);
  }

  protected async login(): Promise<void> {
    await this.run(async () => {
      await this.auth.login(this.username.trim(), this.password);
      location.reload();
    }, 'auth.errors.invalid_credentials');
    this.password = '';
  }

  protected async changePassword(): Promise<void> {
    if (this.newPassword.length < 12) {
      this.error.set('auth.passwordTooShort');
      return;
    }

    await this.run(async () => {
      await this.auth.write('POST', '/api/auth/password', { currentPassword: this.currentPassword, newPassword: this.newPassword });
      this.auth.user.set(null);
      this.auth.expired.set(false);
      this.notice.set('auth.passwordChanged');
    });
    this.currentPassword = '';
    this.newPassword = '';
  }

  protected async logout(): Promise<void> {
    await this.run(async () => {
      await this.auth.logout();
      location.reload();
    });
  }

  private async run(action: () => Promise<void>, unauthorized = 'auth.errors.unauthorized'): Promise<void> {
    if (this.busy() || !this.interactive()) {
      return;
    }

    this.busy.set(true);
    this.error.set('');
    this.notice.set('');

    try {
      await action();
    } catch (failure: unknown) {
      const key = this.auth.errorKey(failure);

      this.error.set(key === 'auth.errors.unauthorized' ? unauthorized : key);
    } finally {
      this.busy.set(false);
    }
  }
}
