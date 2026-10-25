import { AllowanceState } from './allowance-state';
import { SharedAccount } from './shared-account';

export interface AccountSummary extends SharedAccount {
  allowance: AllowanceState;
}
