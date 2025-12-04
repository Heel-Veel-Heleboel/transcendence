import { PasswordError, PasswordErrorCode } from '../constants/password.js';
import { PasswordPolicy } from '../types/password.js';


export function checkSpecialChar(password: string, policy: PasswordPolicy) : PasswordErrorCode | null {
  if (policy.requiredSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password))
    return PasswordError.NO_SPECIAL;
  return null;
}