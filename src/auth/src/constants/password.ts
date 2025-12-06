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