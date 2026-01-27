import { PasswordLimitsConfig } from '../constants/password.js';
import { IPasswordLimitsConfig, IPasswordPolicyConfig } from '../types/password.js';
import { validatePasswordLengthLimits } from '../validators/password.js';
import { parseIntSave } from '../utils/parse-int-save.js';

export function getEnvSaltRounds(def: number): number {
  const rounds = parseIntSave(process.env.BCRYPT_SALT_ROUNDS, def);
  return rounds;
}


const minLength = parseIntSave(process.env.PASSWORD_MIN_LENGTH, PasswordLimitsConfig.DEFAULT_MIN_LENGTH);
const maxLength = parseIntSave(process.env.PASSWORD_MAX_LENGTH, PasswordLimitsConfig.DEFAULT_MAX_LENGTH);

export function createPasswordPolicyConfig(minLength: number, maxLength: number, limits: IPasswordLimitsConfig) : Readonly<IPasswordPolicyConfig> {
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
 

export const PasswordPolicyConfig = createPasswordPolicyConfig(minLength, maxLength, PasswordLimitsConfig);