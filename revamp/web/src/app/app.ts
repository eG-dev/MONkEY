import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TuiButton, TuiRoot } from '@taiga-ui/core';
import { TranslocoDirective } from '@jsverse/transloco';

import { FoundationService } from './foundation.service';
import { LanguageService } from './language.service';
import { LANGUAGES } from './languages';
import { Authentication } from './authentication';
import { AuthenticationService } from './authentication.service';

@Component({
  imports: [TuiRoot, TuiButton, TranslocoDirective, DatePipe, Authentication],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './foundation.html',
})
export class App {
  protected readonly foundation = inject(FoundationService);
  protected readonly language = inject(LanguageService);
  protected readonly languages = Object.values(LANGUAGES);
  private readonly authentication = inject(AuthenticationService);

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
