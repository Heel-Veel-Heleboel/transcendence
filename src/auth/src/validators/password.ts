import { PasswordError, PasswordErrorCode } from '../constants/password.js';
import { PasswordPolicy } from '../types/password.js';


export function checkLowercase(password: string, policy: PasswordPolicy) : PasswordErrorCode | null {
  if (policy.requiredLowercase && !/[a-z]/.test(password))
    return PasswordError.NO_LOWERCASE;
  return null;
}


export function checkUppercase(password: string, policy: PasswordPolicy) : PasswordErrorCode | null {
  if (policy.requiredUppercase && !/[A-Z]/.test(password))
    return PasswordError.NO_UPPERCASE;
  return null;
}


export function checkMaxLength(password: string, policy: PasswordPolicy) : PasswordErrorCode | null {
  return(password.length > policy.maxLength  ?  PasswordError.TOO_LONG : null);
}


export function checkMinLength(password: string, policy: PasswordPolicy) : PasswordErrorCode | null {
  return(password.length < policy.minLength  ?  PasswordError.TOO_SHORT : null);
}


export function checkNumber(password: string, policy: PasswordPolicy) : PasswordErrorCode | null {
  if (policy.requiredNumber && !/[0-9]/.test(password))
    return (PasswordError.NO_NUMBER);
  return null;
}


export function checkSpace(password: string, policy: PasswordPolicy) : PasswordErrorCode | null {
  if (!policy.allowSpaces && /\s/.test(password))
    return PasswordError.HAS_SPACE;
  return null;
}


export function checkSpecialChar(password: string, policy: PasswordPolicy) : PasswordErrorCode | null {
  if (policy.requiredSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password))
    return PasswordError.NO_SPECIAL;
  return null;
}