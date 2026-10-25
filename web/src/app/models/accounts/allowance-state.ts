import { AllowanceConfiguration } from './allowance-configuration';
import { AllowanceExecution } from './allowance-execution';

export interface AllowanceState {
  currency: string;
  timezone: string;
  businessMonth: string;
  nextEffectiveMonth: string;
  latestRevisionId: string | null;
  current: AllowanceConfiguration | null;
  scheduled: AllowanceConfiguration | null;
  latestExecution: AllowanceExecution | null;
  outstandingExecution: AllowanceExecution | null;
}
