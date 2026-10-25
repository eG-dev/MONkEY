import { LedgerEntry } from './ledger-entry';

export interface LedgerHistory {
  timezone: string;
  entries: LedgerEntry[];
  nextCursor: string | null;
  retentionMonths: number;
  retentionCutoffUtc: string | null;
}
