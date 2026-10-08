import { LedgerEntry } from './ledger-entry';

export interface LedgerHistory {
  entries: LedgerEntry[];
  nextCursor: string | null;
}
