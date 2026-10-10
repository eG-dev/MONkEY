import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';

import { AuthenticationService } from '../../services/authentication/authentication.service';

@Component({
  selector: 'app-administration',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslocoDirective],
  template: `
    <ng-container *transloco="let t">
      <div class="page-header">
        <h1 class="page-title">{{ t('shell.administration') }}</h1>
      </div>
      <nav class="tabs" [attr.aria-label]="t('shell.administration')">
        <a
          routerLink="/administration"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
          [routerLinkActiveOptions]="{ exact: true }"
          >{{ t('shell.profile') }}</a
        >
        @if (auth.user()?.role === 'Manager') {
          <a routerLink="/administration/users" routerLinkActive="active" ariaCurrentWhenActive="page">{{ t('auth.users') }}</a>
        }
      </nav>
      <router-outlet />
    </ng-container>
  `,
})
export class Administration {
  protected readonly auth = inject(AuthenticationService);
}
