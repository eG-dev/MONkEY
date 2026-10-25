import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-account-avatar',
  host: { class: 'avatar', '[class.small]': 'small()', 'aria-hidden': 'true' },
  template: `
    @if (imageUrl(); as url) {
      @if (failedUrl() !== url) {
        <img [src]="url" alt="" (error)="failedUrl.set(url)" />
      } @else {
        {{ name().charAt(0) }}
      }
    } @else {
      {{ name().charAt(0) }}
    }
  `,
  styleUrl: './account-avatar.scss',
})
export class AccountAvatar {
  readonly name = input.required<string>();
  readonly imageUrl = input<string | null>(null);
  readonly small = input(false);
  protected readonly failedUrl = signal('');
}
