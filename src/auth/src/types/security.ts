//** Configuration defining the limits for salt values used in password hashing. */
export interface ISaltLimits {
  MIN_SALT_LENGTH: number;
  MAX_SALT_LENGTH: number;
  DEFAULT_SALT_LENGTH: number;
}