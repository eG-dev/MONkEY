import { DOCUMENT } from '@angular/common';
import { Injectable, inject, makeStateKey, REQUEST_CONTEXT, signal, TransferState } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import { isLanguage, LANGUAGES, LanguageId } from '../../i18n/languages';
import { AuthenticationService } from '../authentication/authentication.service';

const languageKey = makeStateKey<LanguageId>('monkey-language');

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly transfer = inject(TransferState);
  private readonly translation = inject(TranslocoService);
  private readonly auth = inject(AuthenticationService);
  private readonly context = inject(REQUEST_CONTEXT, { optional: true }) as { language?: unknown } | null;

  readonly current = signal<LanguageId>('de');

  locale(): string {
    return LANGUAGES[this.current()].locale;
  }

  async initialize(): Promise<void> {
    const requested = this.transfer.get(languageKey, this.context?.language as LanguageId);
    const language = isLanguage(requested) ? requested : 'de';

    this.current.set(language);
    this.transfer.set(languageKey, language);
    this.translation.setActiveLang(language);

    this.document.documentElement.lang = language;
    this.document.documentElement.dir = LANGUAGES[language].direction;

    await firstValueFrom(this.translation.load(language));
  }

  async choose(language: LanguageId): Promise<void> {
    const attributes = 'Path=/; Max-Age=31536000; SameSite=Lax';
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    const user = this.auth.user();

    if (user && !user.mustChangePassword) {
      await this.auth.write('PUT', '/api/auth/language', { language });
    }

    this.document.cookie = `monkey-language=${encodeURIComponent(language)}; ${attributes}${secure}`;

    location.reload();
  }
}
