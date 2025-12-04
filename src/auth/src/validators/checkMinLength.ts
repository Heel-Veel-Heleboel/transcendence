import { PasswordPolicy } from '../types/password.js';
import { PasswordError, PasswordErrorCode } from '../constants/password.js';

export function checkMinLength(password: string, policy: PasswordPolicy) : PasswordErrorCode | null {
  return(password.length < policy.minLength  ?  PasswordError.TOO_SHORT : null);
}