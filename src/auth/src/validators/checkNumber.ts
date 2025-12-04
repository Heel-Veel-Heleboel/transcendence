import { PasswordError, PasswordErrorCode } from '../constants/password.js';
import { PasswordPolicy } from '../types/password.js';


export function checkNumber(password: string, policy: PasswordPolicy) : PasswordErrorCode | null {
  if (policy.requiredNumber && !/[0-9]/.test(password))
    return (PasswordError.NO_NUMBER);
  return null;
}