import bcrypt from 'bcrypt';
import { PasswordPolicy } from '../types/password';




export async function  hashPassword(password: string) : Promise<string> {
  const saltRounds = 10;
  return (bcrypt.hash(password, saltRounds));
}

export async function comparePassword(password: string, hashedPassword: string) : Promise<boolean> {
  return (bcrypt.compare(password, hashedPassword));
}


export function validatePassword(
  password: string,
  policy: PasswordPolicy = {
    minLength: 8,
    maxLength:30,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    noSpaces: true
  }
) {

  const errors: string[] = [];

  if (policy.minLength && password.length < policy.minLength)
    errors.push(`Password must be at least ${policy.minLength} characters long.`);
  if (policy.maxLength && password.length > policy.maxLength)
    errors.push(`Password must be no more than ${policy.maxLength} characters long.`);
  if (policy.requireUppercase && !/[A-Z]/.test(password))
    errors.push('Password must contain an uppercase letter.');
  if (policy.requireLowercase && !/[a-z]/.test(password))
    errors.push('Password must contain a lowercase letter.');
  if (policy.requireNumbers && !/[0-9]/.test(password))
    errors.push('Password must contain a number.');
  if (policy.requireSpecialChars && !/[^A-Za-z0-9]/.test(password))
    errors.push('Password must contain a special character.');
  if (policy.noSpaces && /\s/.test(password))
    errors.push('Password must not contain spaces.');

  return { valid: errors.length === 0, errors };
}