import { PasswordConfigLimits } from '../constants/password.js';
import { PasswordPolicyConfig as PasswordPolicyConfigType } from '../types/password.js';
import { validatePasswordLengthLimits } from '../validators/password.js';
import { parseIntSave } from '../utils/parse-int-save.js';


const minLength = parseIntSave(process.env.PASSWORD_MIN_LENGTH, PasswordConfigLimits.DEFAULT_MIN_LENGTH);
const maxLength = parseIntSave(process.env.PASSWORD_MAX_LENGTH, PasswordConfigLimits.DEFAULT_MAX_LENGTH);

export function createPasswordPolicyConfig(minLength: number, maxLength: number, limits: typeof PasswordConfigLimits) : Readonly<PasswordPolicyConfigType> {
  validatePasswordLengthLimits(minLength, maxLength, limits);
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
 

export const PasswordPolicyConfig = createPasswordPolicyConfig(minLength, maxLength, PasswordConfigLimits);