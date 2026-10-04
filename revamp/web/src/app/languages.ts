import { TUI_ENGLISH_LANGUAGE, TUI_GERMAN_LANGUAGE } from '@taiga-ui/i18n';

import german from '../../public/i18n/de/shell.json';
import english from '../../public/i18n/en/shell.json';

export const LANGUAGES = {
  de: { id: 'de', name: 'Deutsch', locale: 'de-DE', direction: 'ltr', catalog: german, taiga: TUI_GERMAN_LANGUAGE },
  en: { id: 'en', name: 'English', locale: 'en-GB', direction: 'ltr', catalog: english, taiga: TUI_ENGLISH_LANGUAGE },
} as const;

export type LanguageId = keyof typeof LANGUAGES;

export function isLanguage(value: unknown): value is LanguageId {
  return typeof value === 'string' && Object.hasOwn(LANGUAGES, value);
}
