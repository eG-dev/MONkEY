import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TuiRoot } from '@taiga-ui/core';

import { AuthenticationService } from './services/authentication/authentication.service';
import { Login } from './components/login/login';
import { Shell } from './components/shell/shell';

@Component({
  imports: [TuiRoot, RouterOutlet, Login, Shell],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  private readonly authentication = inject(AuthenticationService);

  protected readonly signedIn = computed(() => {
    const user = this.authentication.user();

    return Boolean(user && !user.mustChangePassword);
  });
}
