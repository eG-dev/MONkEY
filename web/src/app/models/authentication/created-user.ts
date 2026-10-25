import { SessionUser } from './session-user';

export interface CreatedUser {
  user: SessionUser;
  temporaryPassword: string;
}
