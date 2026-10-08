import { SharedAccount } from './shared-account';

export interface AccountPageState {
  path: string;
  userId: string;
  accounts: SharedAccount[];
  account: SharedAccount | null;
  error: string;
}
