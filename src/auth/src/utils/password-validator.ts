import { PasswordValidationResult } from '../types/password.js';

const PassordPolicy = {
  minLength: 8,
  maxLength: 30,
  isUppercase: true,
  isLowercase: true,
  isNumber: true,
  isSpecialChar: true,
  isSpaces: false
};

export function validatePassword(password: string) : PasswordValidationResult {

  const messages: string[] = [];

  if (password.length < PassordPolicy.minLength)
    messages.push(`Password must be at least ${PassordPolicy.minLength} characters long.`);
  if (password.length > PassordPolicy.maxLength)
    messages.push(`Password must be at most ${PassordPolicy.maxLength} characters long.`);
  if (PassordPolicy.isUppercase && !/[A-Z]/.test(password))
    messages.push('Password must have at least 1 uppercase letter.');
  if (PassordPolicy.isLowercase && !/[a-z]/.test(password))
    messages.push('Password must have at least 1 lowercase letter.');
  if (PassordPolicy.isNumber && !/[0-9]/.test(password))
    messages.push('Password must have at least 1 number.');
  if (PassordPolicy.isSpecialChar && !/[^A-Za-z0-9]/.test(password))
    messages.push('Password must have at least 1 special character.');
  if (!PassordPolicy.isSpaces && /[\s]/.test(password))
    messages.push('Password must not contain spaces.');

  return {
    valid: messages.length === 0,
    msg: messages
  };
}