import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, makeStateKey, REQUEST, REQUEST_CONTEXT, TransferState } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';

import { AccountPageState } from '../../models/accounts/account-page-state';
import { AccountSummary } from '../../models/accounts/account-summary';
import { AuthenticationService } from '../authentication/authentication.service';
import { SharedAccount } from '../../models/accounts/shared-account';
import { OpeningEntry } from '../../models/accounts/opening-entry';
import { LedgerEntry } from '../../models/accounts/ledger-entry';
import { LedgerHistory } from '../../models/accounts/ledger-history';
import { AllowanceState } from '../../models/accounts/allowance-state';

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
        state.accounts = await this.listSummaries();
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

  async listSummaries(): Promise<AccountSummary[]> {
    const accounts = await this.list();

    return Promise.all(
      accounts.map(async (account) => ({
        ...account,
        allowance: await this.allowance(account.id),
      })),
    );
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

  replaceImage(id: string, file: File): Promise<void> {
    return this.auth.write('PUT', `/api/accounts/${encodeURIComponent(id)}/image`, file);
  }

  allowance(id: string): Promise<AllowanceState> {
    return this.read<AllowanceState>(`/api/accounts/${encodeURIComponent(id)}/allowance`);
  }

  configureAllowance(id: string, enabled: boolean, amount: string | null, expectedRevisionId: string | null): Promise<AllowanceState> {
    return this.auth.write<AllowanceState>('PUT', `/api/accounts/${encodeURIComponent(id)}/allowance`, {
      enabled,
      amount,
      expectedRevisionId,
    });
  }

  removeImage(id: string): Promise<void> {
    return this.auth.write('DELETE', `/api/accounts/${encodeURIComponent(id)}/image`, {});
  }

  postOpening(id: string, amount: string, comment: string, idempotencyKey: string): Promise<OpeningEntry> {
    return this.auth.write<OpeningEntry>('POST', `/api/accounts/${encodeURIComponent(id)}/opening`, { amount, comment, idempotencyKey });
  }

  postTransaction(
    id: string,
    source: 'deposit' | 'withdrawal',
    amount: string,
    comment: string,
    idempotencyKey: string,
  ): Promise<LedgerEntry> {
    return this.auth.write<LedgerEntry>('POST', `/api/accounts/${encodeURIComponent(id)}/transactions`, {
      source,
      amount,
      comment,
      idempotencyKey,
    });
  }

  history(id: string, cursor: string | null): Promise<LedgerHistory> {
    const query = new URLSearchParams({ pageSize: '20' });

    if (cursor) {
      query.set('cursor', cursor);
    }

    return this.read<LedgerHistory>(`/api/accounts/${encodeURIComponent(id)}/transactions?${query}`);
  }

  historyRetentionChanged(failure: unknown): boolean {
    const payload: unknown = failure instanceof HttpErrorResponse ? failure.error : null;

    return (
      failure instanceof HttpErrorResponse &&
      failure.status === 409 &&
      typeof payload === 'object' &&
      payload !== null &&
      'code' in payload &&
      payload.code === 'history_retention_changed'
    );
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
        'invalid_allowance_amount',
        'allowance_conflict',
        'invalid_image',
        'image_too_large',
        'image_dimensions',
        'image_unavailable',
        'account_name_taken',
        'csrf_invalid',
        'invalid_opening_amount',
        'invalid_comment',
        'invalid_idempotency_key',
        'already_initialized',
        'idempotency_conflict',
        'invalid_transaction_amount',
        'invalid_transaction_source',
        'not_initialized',
        'balance_overflow',
        'invalid_page_size',
        'invalid_history_cursor',
      ].includes(code)
      ? `accounts.errors.${code}`
      : 'accounts.errors.unavailable';
  }

  private read<T>(path: string): Promise<T> {
    const headers: Record<string, string> = this.request ? { cookie: this.request.headers.get('cookie') ?? '' } : {};

    return firstValueFrom(this.http.get<T>(`${this.context?.backendUrl ?? ''}${path}`, { headers }).pipe(timeout(5000)));
  }
}
