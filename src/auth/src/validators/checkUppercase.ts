import { PasswordError, PasswordErrorCode } from '../constants/password.js';
import { PasswordPolicy } from '../types/password.js';


export function checkUppercase(password: string, policy: PasswordPolicy) : PasswordErrorCode | null {
  if (policy.requiredUppercase && !/[A-Z]/.test(password))
    return PasswordError.NO_UPPERCASE;
  return null;
}