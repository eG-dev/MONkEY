export interface OpeningEntry {
  id: string;
  accountId: string;
  amount: string;
  currency: string;
  actorId: string;
  actorDisplayName: string;
  occurredAtUtc: string;
  source: string;
  comment: string | null;
}
