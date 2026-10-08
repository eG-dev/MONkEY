import { LedgerEntry } from './ledger-entry';

export interface OpeningEntry extends LedgerEntry {
  source: 'opening';
}
