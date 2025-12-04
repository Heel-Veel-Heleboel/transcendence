import { PasswordError, PasswordErrorCode } from '../constants/password.js';
import { PasswordPolicy } from '../types/password.js';

export function checkLowercase(password: string, policy: PasswordPolicy) : PasswordErrorCode | null {
  if (policy.requiredLowercase && !/[a-z]/.test(password))
    return PasswordError.NO_LOWERCASE;
  return null;
}