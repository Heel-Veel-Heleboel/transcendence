export type PasswordPolicy = {
  minLength?:number;
  maxLength?:number;
  requireUppercase?:boolean;
  requireLowercase?:boolean;
  requireNumbers?:boolean;
  requireSpecialChars?:boolean;
  noSpaces?:boolean;
};