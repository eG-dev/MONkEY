import { SharedAccount } from './shared-account';
import { AccountSummary } from './account-summary';

export interface AccountPageState {
  path: string;
  userId: string;
  accounts: AccountSummary[];
  account: SharedAccount | null;
  error: string;
}
