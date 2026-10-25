export interface AllowanceExecution {
  businessMonth: string;
  amount: string;
  status: 'credited' | 'pending' | 'failed';
  attempts: number | null;
  lastAttemptAtUtc: string | null;
  creditedAtUtc: string | null;
  errorCode: string | null;
}