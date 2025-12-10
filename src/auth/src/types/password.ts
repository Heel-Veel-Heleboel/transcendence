import { PasswordErrorCode } from '../constants/password.js';

export interface PasswordValidationResult  {
  valid: boolean;
  errors: PasswordErrorCode[]; 
  messages: string[];
}

export interface PasswordPolicyConfig{
  minLength: number;
  maxLength: number;
  requiredUppercase: boolean;
  requiredLowercase: boolean;
  requiredNumber: boolean;
  requiredSpecialChar: boolean;
  allowSpaces: boolean;
}

export interface PasswordConfigLimits {
  MIN_LENGTH_LOWER_BOUND: number;
  MIN_LENGTH_UPPER_BOUND: number;
  MAX_LENGTH_LOWER_BOUND: number;
  MAX_LENGTH_UPPER_BOUND: number;
  DEFAULT_MIN_LENGTH: number;
  DEFAULT_MAX_LENGTH: number;
}


export interface SaltLimits {
  MIN_SALT_LENGTH: number;
  MAX_SALT_LENGTH: number;
  DEFAULT_SALT_LENGTH: number;
}