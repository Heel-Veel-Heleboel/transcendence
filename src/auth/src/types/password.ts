import { PasswordErrorCode } from '../constants/password.js';

export interface PasswordValidationResult  {
  valid: boolean;
  errors: PasswordErrorCode[]; 
  messages: string[];
}

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requiredUppercase: boolean;
  requiredLowercase: boolean;
  requiredNumber: boolean;
  requiredSpecialChar: boolean;
  allowSpaces: boolean;
}