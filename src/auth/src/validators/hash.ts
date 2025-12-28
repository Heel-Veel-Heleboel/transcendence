import { SaltLimitsShape } from '../contracts/security.js';

export function validateSaltLengthLimits(saltRounds: number, saltLimits: SaltLimitsShape) : void {
  if (isNaN(saltRounds)) {
    throw new Error(`BCRYPT_SALT_ROUNDS is not a valid intiger: got ${saltRounds}`);
  }
  if (saltRounds < saltLimits.MIN_SALT_LENGTH || saltRounds > saltLimits.MAX_SALT_LENGTH) {
    throw new Error(`BCRYPT_SALT_ROUNDS must be between ${saltLimits.MIN_SALT_LENGTH} and ${saltLimits.MAX_SALT_LENGTH}, got: ${saltRounds}`);
  }
}