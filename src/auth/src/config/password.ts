import { PasswordConfigLimits } from '../constants/password.js';
import { PasswordPolicyConfig as PasswordPolicyConfigType } from '../types/password.js';

export function createPasswordPolicyConfig(passwordLimits: typeof PasswordConfigLimits) : Readonly<PasswordPolicyConfigType> {

  const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH || passwordLimits.DEFAULT_MIN_LENGTH.toString(), 10);
  const maxLength = parseInt(process.env.PASSWORD_MAX_LENGTH || passwordLimits.DEFAULT_MAX_LENGTH.toString(), 10);

  if (isNaN(minLength)) {
    throw new Error(`PASSWORD_MIN_LENGTH is not a valid number: got ${minLength}`);
  }
  if (isNaN(maxLength)) {
    throw new Error(`PASSWORD_MAX_LENGTH is not a valid number: got ${maxLength}`);
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

  return {
    minLength,
    maxLength,
    requiredUppercase: true,
    requiredLowercase: true,
    requiredNumber: true,
    requiredSpecialChar: true,
    allowSpaces: false  
  };
}
 

export const PasswordPolicyConfig = createPasswordPolicyConfig(PasswordConfigLimits);