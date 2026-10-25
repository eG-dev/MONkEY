import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

import { ThemePreference } from '../../models/authentication/theme-preference';
import { AuthenticationService } from '../authentication/authentication.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly auth = inject(AuthenticationService);

  readonly preference = signal<ThemePreference>('system');
  readonly dark = signal(false);

  private readonly systemDark = this.browser ? matchMedia('(prefers-color-scheme: dark)') : null;

  constructor() {
    this.systemDark?.addEventListener('change', () => this.apply(this.preference()));
  }

  initialize(): void {
    this.preference.set(this.auth.user()?.theme ?? 'system');
    this.apply(this.preference());
  }

  async toggleDark(): Promise<void> {
    await this.choose(this.dark() ? 'light' : 'dark');
  }

  private async choose(theme: ThemePreference): Promise<void> {
    const user = this.auth.user();
    this.preference.set(theme);
    this.apply(theme);

    if (user && !user.mustChangePassword) {
      await this.auth.write('PUT', '/api/auth/theme', { theme });
      this.auth.user.set({ ...user, theme });
    }
  }

  private apply(preference: ThemePreference): void {
    const root = this.document.documentElement;
    const dark = preference === 'dark' || (preference === 'system' && Boolean(this.systemDark?.matches));

    this.dark.set(dark);
    root.setAttribute('data-theme-preference', preference);

    // The server cannot know the device setting; CSS media queries cover "system" until the browser decides.
    if (preference !== 'system' || this.browser) {
      root.setAttribute('tuiTheme', dark ? 'dark' : 'light');
    } else {
      root.removeAttribute('tuiTheme');
    }
  }
}
