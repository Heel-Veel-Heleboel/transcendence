import { PasswordPolicy } from '../types/password.js';
import { PasswordError, PasswordErrorCode } from '../constants/password.js';

export function checkMaxLength(password: string, policy: PasswordPolicy) : PasswordErrorCode | null {
  return(password.length > policy.maxLength  ?  PasswordError.TOO_LONG : null);
}