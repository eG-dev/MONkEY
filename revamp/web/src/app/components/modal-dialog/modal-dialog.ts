import { Component, ElementRef, PLATFORM_ID, effect, inject, input, output, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TuiButton } from '@taiga-ui/core';
import { TranslocoDirective } from '@jsverse/transloco';

let dialogCount = 0;

@Component({
  selector: 'app-modal-dialog',
  imports: [TuiButton, TranslocoDirective],
  templateUrl: './modal-dialog.html',
})
export class ModalDialog {
  readonly open = input(false);
  readonly heading = input.required<string>();
  readonly dismissible = input(true);
  readonly closed = output<void>();

  protected readonly titleId = `dialog-title-${++dialogCount}`;

  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private trigger: HTMLElement | null = null;
  private closingFromInput = false;

  constructor() {
    effect(() => {
      const element = this.dialog()?.nativeElement;

      if (!this.browser || !element) {
        return;
      }

      if (this.open() && !element.open) {
        this.trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        element.showModal();
      } else if (!this.open() && element.open) {
        this.closingFromInput = true;
        element.close();
      }
    });
  }

  protected cancel(event: Event): void {
    if (!this.dismissible()) {
      event.preventDefault();
    }
  }

  protected close(): void {
    this.dialog()?.nativeElement.close();
  }

  protected onClose(): void {
    if (this.closingFromInput) {
      this.closingFromInput = false;
    } else {
      this.closed.emit();
    }

    if (this.trigger?.isConnected) {
      this.trigger.focus();
    }
  }
}
