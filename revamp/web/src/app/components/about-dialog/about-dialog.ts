import { Component, ElementRef, computed, inject, signal, viewChildren } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { TuiButton } from '@taiga-ui/core';

import { AboutService } from '../../services/about/about.service';
import { LanguageService } from '../../services/language/language.service';
import { ModalDialog } from '../modal-dialog/modal-dialog';
import buildInfo from '../../../generated/about/build-info.json';
import projectLicense from '../../../generated/about/project-license.json';
import thirdParty from '../../../generated/about/third-party.json';

type AboutTab = 'overview' | 'license' | 'notices' | 'legal';
type NoticeMember = (typeof thirdParty.entries)[number]['components'][number];

function distinctMetadata(members: readonly NoticeMember[]): NoticeMember[] {
  return members.filter(
    (member, index) =>
      members.findIndex(
        (candidate) =>
          candidate.version === member.version &&
          candidate.licenseExpression === member.licenseExpression &&
          candidate.licensingStatus === member.licensingStatus,
      ) === index,
  );
}

@Component({
  selector: 'app-about-dialog',
  imports: [ModalDialog, TranslocoDirective, TuiButton],
  templateUrl: './about-dialog.html',
  styleUrl: './about-dialog.scss',
})
export class AboutDialog {
  protected readonly about = inject(AboutService);
  private readonly language = inject(LanguageService);
  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');
  private readonly content = viewChildren<ElementRef<HTMLElement>>('content');

  protected readonly build = buildInfo;
  protected readonly version = buildInfo.version;
  protected readonly revisionKey = !buildInfo.revision
    ? 'about.revisionUnavailable'
    : buildInfo.kind === 'release'
      ? 'about.releaseRevision'
      : buildInfo.dirty
        ? 'about.dirtyRevision'
        : 'about.developmentRevision';
  protected readonly projectLicense = projectLicense.text;
  protected readonly tabs: readonly AboutTab[] = ['overview', 'license', 'notices', 'legal'];
  protected readonly selected = signal<AboutTab>('overview');
  protected readonly search = signal('');
  protected readonly expanded = signal<ReadonlySet<string>>(new Set());
  protected readonly expandedDocuments = signal<ReadonlySet<string>>(new Set());
  protected readonly noticesCoverage = thirdParty.coverage;
  private readonly components = thirdParty.entries.map((entry) => ({
    id: entry.id,
    name: entry.displayName,
    metadata: distinctMetadata(entry.components),
    members: entry.components,
    groups: entry.groups.map((group) => {
      const members = entry.components.filter((member) => group.componentIds.includes(member.id));
      const licenses = [...new Set(members.map((member) => member.licenseExpression))];
      const licenseExpression = licenses.length === 1 ? licenses[0] : null;

      return {
        id: `about-group-${entry.id}-${group.id}`,
        testId: `about-group-${group.id}`,
        titleKey: group.titleKey ? `about.noticeGroups.${group.titleKey}` : null,
        metadata: distinctMetadata(members),
        members,
        licenseExpression,
        documents: thirdParty.documents
          .filter((document) => members.every((member) => member.documentIds.includes(document.id)))
          .map((document) => ({
            ...document,
            controlId: `about-document-${entry.id}-${group.id}-${document.id}`,
            titleKey: document.kind === 'license' && licenseExpression ? 'about.licenseDocument' : `about.documentTitles.${document.kind}`,
          })),
      };
    }),
  }));
  protected readonly filteredComponents = computed(() => {
    const locale = this.language.locale();
    const query = this.search().trim().toLocaleLowerCase(locale);

    return this.components.filter((entry) =>
      [entry.name, ...entry.members.flatMap((component) => [component.name, component.version, component.licenseExpression])]
        .join(' ')
        .toLocaleLowerCase(locale)
        .includes(query),
    );
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

  protected toggleComponent(id: string, details: HTMLDetailsElement): void {
    if (!details.isConnected || this.expanded().has(id) === details.open) {
      return;
    }

    this.expanded.update((current) => {
      const next = new Set(current);

      if (details.open) {
        next.add(id);
      } else {
        next.delete(id);
      }

      return next;
    });
  }

  protected close(): void {
    this.about.close();
    this.selected.set('overview');
    this.search.set('');
    this.expanded.set(new Set());
    this.expandedDocuments.set(new Set());
  }

  protected toggleDocument(id: string): void {
    this.expandedDocuments.update((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }
}
