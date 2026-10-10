import { AllowanceConfiguration } from './allowance-configuration';

export interface AllowanceState {
  currency: string;
  businessMonth: string;
  nextEffectiveMonth: string;
  latestRevisionId: string | null;
  current: AllowanceConfiguration | null;
  scheduled: AllowanceConfiguration | null;
}
