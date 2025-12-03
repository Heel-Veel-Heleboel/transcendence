import { PasswordPolicy, PasswordValidationResult } from '../types/password.js';


export function validatePassword(password: string, policy: PasswordPolicy) : PasswordValidationResult {

  const messages: string[] = [];

  if (password.length < policy.minLength)
    messages.push(`Password must be at least ${policy.minLength} characters long.`);
  if (password.length > policy.maxLength)
    messages.push(`Password must be at most ${policy.maxLength} characters long.`);
  if (policy.isUppercase && !/[A-Z]/.test(password))
    messages.push('Password must have at least 1 uppercase letter.');
  if (policy.isLowercase && !/[a-z]/.test(password))
    messages.push('Password must have at least 1 lowercase letter.');
  if (policy.isNumber && !/[0-9]/.test(password))
    messages.push('Password must have at least 1 number.');
  if (policy.isSpecialChar && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password))
    messages.push('Password must have at least 1 special character.');
  if (!policy.isSpaces && /[\s]/.test(password))
    messages.push('Password must not contain spaces.');

  return {
    valid: messages.length === 0,
    msg: messages
  };
}