import { PasswordError, PasswordErrorCode } from '../constants/password.js';
import { PasswordPolicyConfig, PasswordValidationResult } from '../types/password.js';


export function checkLowercase(password: string, policy: PasswordPolicyConfig) : PasswordErrorCode | null {
  if (policy.requiredLowercase && !/[a-z]/.test(password))
    return PasswordError.NO_LOWERCASE;
  return null;
}


export function checkUppercase(password: string, policy: PasswordPolicyConfig) : PasswordErrorCode | null {
  if (policy.requiredUppercase && !/[A-Z]/.test(password))
    return PasswordError.NO_UPPERCASE;
  return null;
}


export function checkMaxLength(password: string, policy: PasswordPolicyConfig) : PasswordErrorCode | null {
  return(password.length > policy.maxLength  ?  PasswordError.TOO_LONG : null);
}


export function checkMinLength(password: string, policy: PasswordPolicyConfig) : PasswordErrorCode | null {
  return(password.length < policy.minLength  ?  PasswordError.TOO_SHORT : null);
}


export function checkNumber(password: string, policy: PasswordPolicyConfig) : PasswordErrorCode | null {
  if (policy.requiredNumber && !/[0-9]/.test(password))
    return (PasswordError.NO_NUMBER);
  return null;
}


export function checkSpace(password: string, policy: PasswordPolicyConfig) : PasswordErrorCode | null {
  if (!policy.allowSpaces && /\s/.test(password))
    return PasswordError.HAS_SPACE;
  return null;
}


export function checkSpecialChar(password: string, policy: PasswordPolicyConfig) : PasswordErrorCode | null {
  if (policy.requiredSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password))
    return PasswordError.NO_SPECIAL;
  return null;
}



import { getPasswordErrorMessage } from '../utils/password/error-message.js';

export function validatePassword(password: string, policy: PasswordPolicyConfig) : PasswordValidationResult {

  type PasswordRules = (password: string, policy: PasswordPolicyConfig) => PasswordErrorCode | null;

  const rules : PasswordRules[] = [
    checkLowercase,
    checkNumber,
    checkSpace,
    checkUppercase,
    checkMinLength,
    checkMaxLength,
    checkSpecialChar
  ] ;
  const errorCodes: PasswordErrorCode[] = [];

  for (const rule of rules) {
    const error = rule(password, policy);
    if (error)
      errorCodes.push(error);
  }

  const messages = errorCodes.map(code => (getPasswordErrorMessage(code, policy)));
  return {
    valid: errorCodes.length === 0,
    errors: errorCodes,
    messages: messages
  };
}