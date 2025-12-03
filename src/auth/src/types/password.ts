export interface PasswordValidationResult  {
  valid: boolean;
  msg: string[]; 
}

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  isUppercase: boolean;
  isLowercase: boolean;
  isNumber: boolean;
  isSpecialChar: boolean;
  isSpaces: boolean;
}