export interface LedgerEntry {
  id: string;
  accountId: string;
  amount: string;
  currency: string;
  actorId: string;
  actorDisplayName: string;
  occurredAtUtc: string;
  source: 'opening' | 'deposit' | 'withdrawal';
  comment: string | null;
}
