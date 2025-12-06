import { validateSaltLengthLimits } from '../validators/password.js';
import { SaltLimits } from '../constants/password.js';
import { parseIntSave } from '../utils/parse-int-save.js';


export function getEnvSaltRounds(saltLimits: typeof SaltLimits) : number {
  const rounds = parseIntSave(process.env.BCRYPT_SALT_ROUNDS, 12);
  validateSaltLengthLimits(rounds, saltLimits);
  return rounds;
}