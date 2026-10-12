import { LedgerEntry } from './ledger-entry';

export interface LedgerHistory {
  timezone: string;
  entries: LedgerEntry[];
  nextCursor: string | null;
}
