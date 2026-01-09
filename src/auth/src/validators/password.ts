import { PasswordError, PasswordErrorCode } from '../constants/password.js';
import { PasswordPolicyConfigShape, PasswordValidationResultShape, PasswordLimitsConfigShape } from '../types/password.js';


export function checkLowercase(password: string, policy: PasswordPolicyConfigShape) : PasswordErrorCode | null {
  if (policy.requiredLowercase && !/[a-z]/.test(password))
    return PasswordError.NO_LOWERCASE;
  return null;
}


export function checkUppercase(password: string, policy: PasswordPolicyConfigShape) : PasswordErrorCode | null {
  if (policy.requiredUppercase && !/[A-Z]/.test(password))
    return PasswordError.NO_UPPERCASE;
  return null;
}


export function checkMaxLength(password: string, policy: PasswordPolicyConfigShape) : PasswordErrorCode | null {
  return(password.length > policy.maxLength  ?  PasswordError.TOO_LONG : null);
}


export function checkMinLength(password: string, policy: PasswordPolicyConfigShape) : PasswordErrorCode | null {
  return(password.length < policy.minLength  ?  PasswordError.TOO_SHORT : null);
}


export function checkNumber(password: string, policy: PasswordPolicyConfigShape) : PasswordErrorCode | null {
  if (policy.requiredNumber && !/[0-9]/.test(password))
    return (PasswordError.NO_NUMBER);
  return null;
}


export function checkSpace(password: string, policy: PasswordPolicyConfigShape) : PasswordErrorCode | null {
  if (!policy.allowSpaces && /\s/.test(password))
    return PasswordError.HAS_SPACE;
  return null;
}


export function checkSpecialChar(password: string, policy: PasswordPolicyConfigShape) : PasswordErrorCode | null {
  if (policy.requiredSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password))
    return PasswordError.NO_SPECIAL;
  return null;
}



import { getPasswordErrorMessage } from '../utils/password-error-message.js';

export function validatePassword(password: string, policy: PasswordPolicyConfigShape) : PasswordValidationResultShape {

  type PasswordRules = (password: string, policy: PasswordPolicyConfigShape) => PasswordErrorCode | null;

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


export function validatePasswordLengthLimits(minLength: number, maxLength:number, passwordLimits: PasswordLimitsConfigShape) : void {

  if (isNaN(minLength)) {
    throw new Error(`PASSWORD_MIN_LENGTH is not a valid intiger: got ${minLength}`);
  }
  if (isNaN(maxLength)) {
    throw new Error(`PASSWORD_MAX_LENGTH is not a valid intiger: got ${maxLength}`);
  }
  if (minLength < passwordLimits.MIN_LENGTH_LOWER_BOUND || minLength > passwordLimits.MIN_LENGTH_UPPER_BOUND) {
    throw new Error(`PASSWORD_MIN_LENGTH must be between ${passwordLimits.MIN_LENGTH_LOWER_BOUND} and ${passwordLimits.MIN_LENGTH_UPPER_BOUND}, got: ${minLength}`);
  }
  if (maxLength < passwordLimits.MAX_LENGTH_LOWER_BOUND || maxLength > passwordLimits.MAX_LENGTH_UPPER_BOUND) {
    throw new Error(`PASSWORD_MAX_LENGTH must be between ${passwordLimits.MAX_LENGTH_LOWER_BOUND} and ${passwordLimits.MAX_LENGTH_UPPER_BOUND}, got: ${maxLength}`);
  }
  if (minLength >= maxLength) {
    throw new Error(
      `PASSWORD_MIN_LENGTH (${minLength}) must be less than PASSWORD_MAX_LENGTH (${maxLength})`
    );
  }
}
