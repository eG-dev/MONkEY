import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TuiButton, TuiRoot } from '@taiga-ui/core';
import { TranslocoDirective } from '@jsverse/transloco';

import { FoundationService } from './services/foundation/foundation.service';
import { LanguageService } from './services/language/language.service';
import { LANGUAGES } from './i18n/languages';
import { Authentication } from './components/authentication/authentication';
import { AuthenticationService } from './services/authentication/authentication.service';

@Component({
  imports: [TuiRoot, TuiButton, TranslocoDirective, DatePipe, Authentication, RouterLink, RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly foundation = inject(FoundationService);
  protected readonly language = inject(LanguageService);
  protected readonly languages = Object.values(LANGUAGES);
  protected readonly authentication = inject(AuthenticationService);

  protected async chooseLanguage(event: Event): Promise<void> {
    const value = (event.target as HTMLSelectElement).value;
    const attributes = 'Path=/; Max-Age=31536000; SameSite=Lax';
    const secure = location.protocol === 'https:' ? '; Secure' : '';

    if (this.authentication.user() && !this.authentication.user()?.mustChangePassword) {
      await this.authentication.write('PUT', '/api/auth/language', { language: value });
    }

    document.cookie = `monkey-language=${encodeURIComponent(value)}; ${attributes}${secure}`;

    location.reload();
  }

  protected reload(): void {
    location.reload();
  }
}
