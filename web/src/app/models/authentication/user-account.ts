import { SessionUser } from './session-user';

export interface UserAccount {
  user: SessionUser;
  isActive: boolean;
}
