import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';

import { AuthenticationService } from '../authentication/authentication.service';
import { UserAccount } from '../../models/authentication/user-account';
import { CreatedUser } from '../../models/authentication/created-user';
import { TemporaryPassword } from '../../models/authentication/temporary-password';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthenticationService);

  list(): Promise<UserAccount[]> {
    return firstValueFrom(this.http.get<UserAccount[]>('/api/users').pipe(timeout(5000)));
  }

  create(username: string, displayName: string, role: 'Manager' | 'Member'): Promise<CreatedUser> {
    return this.auth.write<CreatedUser>('POST', '/api/users', { username, displayName, role });
  }

  update(id: string, displayName: string, role: 'Manager' | 'Member', isActive: boolean): Promise<void> {
    return this.auth.write('PUT', `/api/users/${encodeURIComponent(id)}`, { displayName, role, isActive });
  }

  resetPassword(id: string): Promise<TemporaryPassword> {
    return this.auth.write<TemporaryPassword>('POST', `/api/users/${encodeURIComponent(id)}/password`, {});
  }
}
