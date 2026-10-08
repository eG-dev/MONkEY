import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, makeStateKey, REQUEST, REQUEST_CONTEXT, TransferState } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';

import { AccountPageState } from '../../models/accounts/account-page-state';
import { AuthenticationService } from '../authentication/authentication.service';
import { SharedAccount } from '../../models/accounts/shared-account';
import { OpeningEntry } from '../../models/accounts/opening-entry';

const accountPageKey = makeStateKey<AccountPageState | null>('monkey-account-page');

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthenticationService);
  private readonly transfer = inject(TransferState);
  private readonly request = inject(REQUEST, { optional: true });
  private readonly context = inject(REQUEST_CONTEXT, { optional: true }) as { backendUrl?: string } | null;

  private initial: AccountPageState | null = null;

  async initialize(): Promise<void> {
    if (this.transfer.hasKey(accountPageKey)) {
      this.initial = this.transfer.get(accountPageKey, null);
      this.transfer.remove(accountPageKey);
      return;
    }

    const user = this.auth.user();

    if (!this.request || !this.context?.backendUrl || !user || user.mustChangePassword) {
      return;
    }

    const pathname = new URL(this.request.url).pathname.replace(/\/$/, '') || '/';
    const path = pathname === '/' ? '/accounts' : pathname;

    if (path !== '/accounts' && !/^\/accounts\/[\w-]+$/.test(path)) {
      return;
    }

    const state: AccountPageState = { path, userId: user.id, accounts: [], account: null, error: '' };

    try {
      if (path === '/accounts') {
        state.accounts = await this.list();
      } else {
        state.account = await this.find(path.slice('/accounts/'.length));
      }
    } catch (failure: unknown) {
      state.error = this.errorKey(failure);
    }

    this.initial = state;
    this.transfer.set(accountPageKey, state);
  }

  consume(path: string): AccountPageState | null {
    const state = this.initial;

    if (state?.path !== path || state.userId !== this.auth.user()?.id) {
      return null;
    }

    this.initial = null;

    return state;
  }

  list(): Promise<SharedAccount[]> {
    return this.read<SharedAccount[]>('/api/accounts');
  }

  find(id: string): Promise<SharedAccount> {
    return this.read<SharedAccount>(`/api/accounts/${encodeURIComponent(id)}`);
  }

  create(name: string): Promise<SharedAccount> {
    return this.auth.write<SharedAccount>('POST', '/api/accounts', { name });
  }

  update(id: string, name: string): Promise<SharedAccount> {
    return this.auth.write<SharedAccount>('PUT', `/api/accounts/${encodeURIComponent(id)}`, { name });
  }

  postOpening(id: string, amount: string, comment: string, idempotencyKey: string): Promise<OpeningEntry> {
    return this.auth.write<OpeningEntry>('POST', `/api/accounts/${encodeURIComponent(id)}/opening`, { amount, comment, idempotencyKey });
  }

  errorKey(failure: unknown): string {
    if (failure instanceof HttpErrorResponse && failure.status === 401) {
      this.auth.clearSession();
      return 'accounts.errors.unauthorized';
    }

    if (failure instanceof HttpErrorResponse && failure.status === 403) {
      return 'accounts.errors.forbidden';
    }

    if (failure instanceof HttpErrorResponse && failure.status === 404) {
      return 'accounts.errors.not_found';
    }

    const payload: unknown = failure instanceof HttpErrorResponse ? failure.error : null;
    const code = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>)['code'] : null;

    return typeof code === 'string' &&
      [
        'invalid_account_name',
        'account_name_taken',
        'csrf_invalid',
        'invalid_opening_amount',
        'invalid_comment',
        'invalid_idempotency_key',
        'already_initialized',
        'idempotency_conflict',
      ].includes(code)
      ? `accounts.errors.${code}`
      : 'accounts.errors.unavailable';
  }

  private read<T>(path: string): Promise<T> {
    const headers: Record<string, string> = this.request ? { cookie: this.request.headers.get('cookie') ?? '' } : {};

    return firstValueFrom(this.http.get<T>(`${this.context?.backendUrl ?? ''}${path}`, { headers }).pipe(timeout(5000)));
  }
}
