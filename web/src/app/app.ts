import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TuiButton, TuiRoot } from '@taiga-ui/core';
import { TranslocoDirective } from '@jsverse/transloco';

import { AuthenticationService } from './services/authentication/authentication.service';
import { Login } from './components/login/login';
import { Shell } from './components/shell/shell';
import { AboutDialog } from './components/about-dialog/about-dialog';
import { ModalDialog } from './components/modal-dialog/modal-dialog';
import { AboutService } from './services/about/about.service';

@Component({
  imports: [TuiRoot, TuiButton, TranslocoDirective, RouterOutlet, Login, Shell, AboutDialog, ModalDialog],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  private readonly authentication = inject(AuthenticationService);
  protected readonly about = inject(AboutService);

  protected readonly signedIn = computed(() => {
    const user = this.authentication.user();

    return Boolean(user && !user.mustChangePassword);
  });

  protected reload(): void {
    location.reload();
  }
}
