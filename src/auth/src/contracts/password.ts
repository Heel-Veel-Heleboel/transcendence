import { PasswordErrorCode } from '../constants/password.js';

// Result of password validation process
export interface PasswordValidationResultShape  {
  valid: boolean;
  errors: PasswordErrorCode[]; 
  messages: string[];
}

// Configuration defining the password policy.
export interface PasswordPolicyConfigShape{
  minLength: number;
  maxLength: number;
  requiredUppercase: boolean;
  requiredLowercase: boolean;
  requiredNumber: boolean;
  requiredSpecialChar: boolean;
  allowSpaces: boolean;
}

// Configuration defining the limits for password lengths.
export interface PasswordLimitsConfigShape {
  MIN_LENGTH_LOWER_BOUND: number;
  MIN_LENGTH_UPPER_BOUND: number;
  MAX_LENGTH_LOWER_BOUND: number;
  MAX_LENGTH_UPPER_BOUND: number;
  DEFAULT_MIN_LENGTH: number;
  DEFAULT_MAX_LENGTH: number;
}
