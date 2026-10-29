import { OpeningEntry } from './opening-entry';

export interface SharedAccount {
  id: string;
  name: string;
  currency: string;
  balance: string | null;
  imageUrl: string | null;
  openingEntry: OpeningEntry | null;
  purgeAtUtc: string | null;
}
