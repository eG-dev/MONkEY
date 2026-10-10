import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, makeStateKey, REQUEST_CONTEXT, signal, TransferState } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';

import { SessionUser } from '../../models/authentication/session-user';

const sessionKey = makeStateKey<SessionUser | null>('monkey-session-profile');

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private readonly http = inject(HttpClient);
  private readonly transfer = inject(TransferState);
  private readonly context = inject(REQUEST_CONTEXT, { optional: true }) as { session?: SessionUser | null } | null;

  readonly user = signal<SessionUser | null>(null);
  readonly expired = signal(false);
  readonly notice = signal('');

  initialize(): void {
    if (this.transfer.hasKey(sessionKey)) {
      this.user.set(this.transfer.get(sessionKey, null));
      this.transfer.remove(sessionKey);
    } else if (this.context) {
      const user = this.context.session ?? null;
      this.user.set(user);
      this.transfer.set(sessionKey, user);
    }
  }

  async login(username: string, password: string): Promise<void> {
    const user = await this.write<SessionUser>('POST', '/api/auth/login', { username, password });
    this.user.set(user);
  }

  clearSession(): void {
    if (this.user()) {
      this.expired.set(true);
    }

    this.user.set(null);

    if (this.context) {
      this.transfer.set(sessionKey, null);
    }
  }

  async logout(): Promise<void> {
    await this.write('POST', '/api/auth/logout', {});
    this.user.set(null);
  }

  errorKey(failure: unknown): string {
    if (failure instanceof HttpErrorResponse && failure.status === 401) {
      this.clearSession();
    }

    const codes = ['invalid_user', 'invalid_password', 'last_manager', 'csrf_invalid', 'invalid_language', 'invalid_theme', 'not_found'];
    const payload: unknown = failure instanceof HttpErrorResponse ? failure.error : null;
    const code = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>)['code'] : null;
    const key =
      typeof code === 'string' && codes.includes(code)
        ? code
        : failure instanceof HttpErrorResponse && failure.status === 401
          ? 'unauthorized'
          : failure instanceof HttpErrorResponse && failure.status === 403
            ? 'forbidden'
            : failure instanceof HttpErrorResponse && failure.status === 429
              ? 'throttled'
              : 'unavailable';

    return `auth.errors.${key}`;
  }

  async write<T = void>(method: 'POST' | 'PUT', url: string, body: object): Promise<T> {
    const csrf = await firstValueFrom(this.http.get<{ token: string }>('/api/auth/csrf').pipe(timeout(5000)));

    return firstValueFrom(
      this.http
        .request<T>(method, url, {
          body,
          headers: { 'X-Monkey-CSRF': csrf.token },
        })
        .pipe(timeout(5000)),
    );
  }
}
