import { Component, ElementRef, computed, inject, signal, viewChildren } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { TuiButton } from '@taiga-ui/core';

import { AboutService } from '../../services/about/about.service';
import { LanguageService } from '../../services/language/language.service';
import { ModalDialog } from '../modal-dialog/modal-dialog';
import packageJson from '../../../../package.json';
import projectLicense from './project-license.json';

type AboutTab = 'overview' | 'notices' | 'legal';

@Component({
  selector: 'app-about-dialog',
  imports: [ModalDialog, TranslocoDirective, TuiButton],
  templateUrl: './about-dialog.html',
  styleUrl: './about-dialog.scss',
})
export class AboutDialog {
  protected readonly about = inject(AboutService);
  private readonly language = inject(LanguageService);
  private readonly translation = inject(TranslocoService);
  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');
  private readonly content = viewChildren<ElementRef<HTMLElement>>('content');

  protected readonly version = packageJson.version;
  protected readonly projectLicense = projectLicense.text;
  protected readonly tabs: readonly AboutTab[] = ['overview', 'notices', 'legal'];
  protected readonly selected = signal<AboutTab>('overview');
  protected readonly search = signal('');
  private readonly components = [
    { id: 'angular', name: 'Angular' },
    { id: 'dotnet', name: '.NET runtime' },
    { id: 'roboto', name: 'Roboto' },
    { id: 'lucide', name: 'Lucide' },
  ];
  protected readonly filteredComponents = computed(() => {
    const locale = this.language.locale();
    const query = this.search().trim().toLocaleLowerCase(locale);

    return this.components
      .map((component) => ({
        ...component,
        name: component.id === 'dotnet' ? this.translation.translate('about.runtime') : component.name,
      }))
      .filter((component) => component.name.toLocaleLowerCase(locale).includes(query));
  });

  protected select(tab: AboutTab, focus = false): void {
    this.selected.set(tab);
    this.content()[0]?.nativeElement.scrollTo({ top: 0 });

    if (focus) {
      const button = this.tabButtons().find((entry) => entry.nativeElement.id === `about-tab-${tab}`)?.nativeElement;

      button?.focus({ preventScroll: true });
      button?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  protected navigateTabs(event: KeyboardEvent, tab: AboutTab): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const index = this.tabs.indexOf(tab);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? this.tabs.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + this.tabs.length) % this.tabs.length;

    this.select(this.tabs[next], true);
  }

  protected close(): void {
    this.about.close();
    this.selected.set('overview');
    this.search.set('');
  }
}
