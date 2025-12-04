import { PasswordPolicy, PasswordValidationResult } from '../../types/password.js';
import {
  checkLowercase,
  checkNumber,
  checkSpace,
  checkUppercase,
  checkMinLength,
  checkMaxLength,
  checkSpecialChar
} from '../../validators/index.js';
import { PasswordErrorCode } from '../../constants/password.js';
import { getPasswordErrorMessage } from './password-error-message.js';

export function validatePassword(password: string, policy: PasswordPolicy) : PasswordValidationResult {

  type PasswordRules = (password: string, policy: PasswordPolicy) => PasswordErrorCode | null;

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