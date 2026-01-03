import bcrypt from 'bcryptjs';
import { getEnvSaltRounds } from '../config/password.js';
import { SaltLimitsShape } from '../types/security.js';
import { validateSaltLengthLimits } from '../validators/hash.js';

export async function passwordHasher(password: string, saltLimits: SaltLimitsShape): Promise<string> {
  if (!password) {
    throw new Error('Input password is required');
  }
  const saltRounds = getEnvSaltRounds(saltLimits.DEFAULT_SALT_LENGTH);
  validateSaltLengthLimits(saltRounds, saltLimits);
  return await bcrypt.hash(password, saltRounds);
}

export async function comparePasswordHash(str: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(str, hash);
}