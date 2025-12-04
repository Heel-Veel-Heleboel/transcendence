import { PasswordError, PasswordErrorCode } from '../constants/password.js';
import { PasswordPolicy } from '../types/password.js';


export function checkSpace(password: string, policy: PasswordPolicy) : PasswordErrorCode | null {
  if (!policy.allowSpaces && /\s/.test(password))
    return PasswordError.HAS_SPACE;
  return null;
}