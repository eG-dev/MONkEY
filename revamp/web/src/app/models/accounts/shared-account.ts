import { OpeningEntry } from './opening-entry';

export interface SharedAccount {
  id: string;
  name: string;
  currency: string;
  balance: string | null;
  openingEntry: OpeningEntry | null;
}
