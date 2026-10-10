import { Component, ElementRef, PLATFORM_ID, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { filter } from 'rxjs';

import { AuthenticationService } from '../../services/authentication/authentication.service';
import { ThemeService } from '../../services/theme/theme.service';
import packageJson from '../../../../package.json';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, TranslocoDirective],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  host: { '(document:keydown.escape)': 'dismissDrawer()' },
})
export class Shell {
  protected readonly auth = inject(AuthenticationService);
  protected readonly theme = inject(ThemeService);
  protected readonly version = packageJson.version;

  private readonly wideQuery = isPlatformBrowser(inject(PLATFORM_ID)) ? matchMedia('(min-width: 1440px)') : null;
  protected readonly wide = signal(this.wideQuery?.matches ?? true);
  protected readonly collapsed = signal(false);
  protected readonly drawerOpen = signal(false);
  protected readonly navigationVisible = computed(() => (this.wide() ? !this.collapsed() : this.drawerOpen()));
  private readonly userMenu = viewChild<ElementRef<HTMLElement>>('userMenu');
  private readonly router = inject(Router);
  private readonly hydrated = signal(false);
  private readonly navigated = signal(this.router.navigated);
  // NavigationEnd closes the drawer and menu, so opening them earlier would be undone.
  protected readonly interactive = computed(() => this.hydrated() && this.navigated());

  constructor() {
    afterNextRender(() => this.hydrated.set(true));

    this.wideQuery?.addEventListener('change', (event) => {
      this.wide.set(event.matches);
      this.drawerOpen.set(false);
    });

    this.router
      .events.pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.navigated.set(true);
        this.drawerOpen.set(false);
        this.userMenu()?.nativeElement.hidePopover();
      });
  }

  protected toggleNavigation(): void {
    if (this.wide()) {
      this.collapsed.update((collapsed) => !collapsed);
    } else {
      this.drawerOpen.update((open) => !open);
    }
  }

  protected dismissDrawer(): void {
    if (!this.wide() && this.drawerOpen() && !document.querySelector('dialog[open]')) {
      this.drawerOpen.set(false);
      document.getElementById('shell-navigation-toggle')?.focus();
    }
  }

  protected async logout(): Promise<void> {
    try {
      await this.auth.logout();
    } finally {
      location.reload();
    }
  }

  protected async toggleDark(): Promise<void> {
    await this.theme.toggleDark();
  }
}
