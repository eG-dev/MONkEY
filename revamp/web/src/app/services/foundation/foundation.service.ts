import { HttpClient } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { Injectable, inject, makeStateKey, PLATFORM_ID, REQUEST_CONTEXT, signal, TransferState } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';

import { FoundationState } from '../../models/foundation/foundation-state';

const foundationKey = makeStateKey<FoundationState | null>('monkey-foundation');

@Injectable({ providedIn: 'root' })
export class FoundationService {
  private readonly http = inject(HttpClient);
  private readonly platform = inject(PLATFORM_ID);
  private readonly transfer = inject(TransferState);
  private readonly context = inject(REQUEST_CONTEXT, { optional: true }) as { backendUrl?: string } | null;

  readonly state = signal<FoundationState | null>(null);

  async initialize(): Promise<void> {
    if (isPlatformServer(this.platform) && !this.context?.backendUrl) {
      return;
    }

    if (this.transfer.hasKey(foundationKey)) {
      this.state.set(this.transfer.get(foundationKey, null));
      this.transfer.remove(foundationKey);
      return;
    }

    try {
      const state = await firstValueFrom(
        this.http.get<FoundationState>(`${this.context?.backendUrl ?? ''}/api/foundation`).pipe(timeout(5000)),
      );

      this.state.set(state);
      this.transfer.set(foundationKey, state);
    } catch {
      this.transfer.set(foundationKey, null);
    }
  }
}
