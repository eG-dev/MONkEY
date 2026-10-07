import { ApplicationConfig, computed, inject, isDevMode, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import germanLocale from '@angular/common/locales/de';
import englishLocale from '@angular/common/locales/en-GB';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withNoHttpTransferCache } from '@angular/platform-browser';
import { provideTaiga } from '@taiga-ui/core';
import { TUI_LANGUAGE } from '@taiga-ui/i18n';
import { provideTransloco } from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';

import { routes } from './app.routes';
import { LanguageService } from './language.service';
import { FoundationService } from './foundation.service';
import { BundledCatalogLoader } from './bundled-catalog.loader';
import { LANGUAGES } from './languages';
import { AuthenticationService } from './authentication.service';

registerLocaleData(germanLocale);
registerLocaleData(englishLocale);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideClientHydration(withNoHttpTransferCache()),

    provideTaiga({ mode: 'light', scrollbars: 'native' }),

    provideTransloco({
      config: {
        availableLangs: Object.keys(LANGUAGES),
        defaultLang: 'de',
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: BundledCatalogLoader,
    }),
    provideTranslocoMessageformat(),

    {
      provide: TUI_LANGUAGE,
      useFactory: () => {
        const language = inject(LanguageService);

        return computed(() => LANGUAGES[language.current()].taiga);
      },
    },

    provideAppInitializer(() => {
      const language = inject(LanguageService);
      const foundation = inject(FoundationService);
      inject(AuthenticationService).initialize();

      return Promise.all([language.initialize(), foundation.initialize()]);
    }),
  ],
};
