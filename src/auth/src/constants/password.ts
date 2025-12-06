import { PasswordConfigLimits as Limits } from '../types/password.js';

export const PasswordError = {
  TOO_SHORT: 'TOO_SHORT',
  TOO_LONG: 'TOO_LONG',
  NO_UPPERCASE: 'NO_UPPERCASE',
  NO_LOWERCASE: 'NO_LOWERCASE',
  NO_SPECIAL: 'NO_SPECIAL',
  NO_NUMBER: 'NO_NUMBER',
  HAS_SPACE: 'HAS_SPACE'
} as const ;

export type PasswordErrorCode = typeof PasswordError[keyof typeof PasswordError];


export const PasswordConfigLimits: Limits = {
  MIN_LENGTH_LOWER_BOUND: 1,
  MIN_LENGTH_UPPER_BOUND: 64,
  MAX_LENGTH_LOWER_BOUND: 8,
  MAX_LENGTH_UPPER_BOUND: 128,
  DEFAULT_MIN_LENGTH: 8,
  DEFAULT_MAX_LENGTH: 30
} as const ;

export const SaltLimits = {
  MIN_SALT_LENGTH: 1,
  MAX_SALT_LENGTH: 18
} as const;