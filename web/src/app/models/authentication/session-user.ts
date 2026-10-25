import { ThemePreference } from './theme-preference';

export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  role: 'Manager' | 'Member';
  language: 'de' | 'en';
  theme: ThemePreference;
  mustChangePassword: boolean;
}

export function isSessionUser(value: unknown): value is SessionUser {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const user = value as Record<string, unknown>;

  return (
    typeof user['id'] === 'string' &&
    typeof user['username'] === 'string' &&
    typeof user['displayName'] === 'string' &&
    (user['role'] === 'Manager' || user['role'] === 'Member') &&
    (user['language'] === 'de' || user['language'] === 'en') &&
    (user['theme'] === 'system' || user['theme'] === 'light' || user['theme'] === 'dark') &&
    typeof user['mustChangePassword'] === 'boolean'
  );
}
