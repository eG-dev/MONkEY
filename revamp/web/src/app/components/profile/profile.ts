import { afterNextRender, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton } from '@taiga-ui/core';
import { TranslocoDirective } from '@jsverse/transloco';

import { AuthenticationService } from '../../services/authentication/authentication.service';
import { LanguageService } from '../../services/language/language.service';
import { ThemeService } from '../../services/theme/theme.service';
import { LANGUAGES, isLanguage } from '../../i18n/languages';
import { ModalDialog } from '../modal-dialog/modal-dialog';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, TuiButton, TranslocoDirective, ModalDialog],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  protected readonly auth = inject(AuthenticationService);
  protected readonly language = inject(LanguageService);
  protected readonly theme = inject(ThemeService);
  protected readonly languages = Object.values(LANGUAGES);

  protected readonly interactive = signal(false);
  protected readonly busy = signal(false);
  protected readonly changing = signal(false);
  protected readonly error = signal('');
  protected readonly preferenceError = signal('');

  protected currentPassword = '';
  protected newPassword = '';

  constructor() {
    afterNextRender(() => this.interactive.set(true));
  }

  protected async chooseLanguage(event: Event): Promise<void> {
    const value = (event.target as HTMLSelectElement).value;

    if (isLanguage(value)) {
      await this.savePreference(() => this.language.choose(value));
    }
  }

  protected async toggleDark(): Promise<void> {
    await this.savePreference(() => this.theme.toggleDark());
  }

  protected openPasswordDialog(): void {
    this.currentPassword = '';
    this.newPassword = '';
    this.error.set('');
    this.changing.set(true);
  }

  protected async changePassword(): Promise<void> {
    if (this.busy()) {
      return;
    }

    if (this.newPassword.length < 12) {
      this.error.set('auth.passwordTooShort');
      return;
    }

    this.busy.set(true);
    this.error.set('');

    try {
      await this.auth.write('POST', '/api/auth/password', { currentPassword: this.currentPassword, newPassword: this.newPassword });
      this.changing.set(false);
      this.auth.notice.set('auth.passwordChanged');
      this.auth.user.set(null);
    } catch (failure: unknown) {
      this.error.set(this.auth.errorKey(failure));
      this.busy.set(false);
    }
  }

  private async savePreference(action: () => Promise<void>): Promise<void> {
    this.preferenceError.set('');

    try {
      await action();
    } catch (failure: unknown) {
      this.preferenceError.set(this.auth.errorKey(failure));
    }
  }
}
