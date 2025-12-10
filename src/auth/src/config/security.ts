import { validateSaltLengthLimits } from '../validators/hash.js';
import { SaltLimits } from '../constants/security.js';
import { parseIntSave } from '../utils/parse-int-save.js';


export function getEnvSaltRounds(saltLimits: typeof SaltLimits) : number {
  const rounds = parseIntSave(process.env.BCRYPT_SALT_ROUNDS, SaltLimits.DEFAULT_SALT_LENGTH);
  validateSaltLengthLimits(rounds, saltLimits);
  return rounds;
}