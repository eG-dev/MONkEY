import { Injectable } from '@angular/core';
import { TranslocoLoader } from '@jsverse/transloco';
import { of } from 'rxjs';

import { isLanguage, LANGUAGES } from './languages';

@Injectable({ providedIn: 'root' })
export class BundledCatalogLoader implements TranslocoLoader {
  getTranslation(language: string) {
    return of(LANGUAGES[isLanguage(language) ? language : 'en'].catalog);
  }
}
