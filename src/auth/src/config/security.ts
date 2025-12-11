import { parseIntSave } from '../utils/parse-int-save.js';

export function getEnvSaltRounds(def: number) : number {
  const rounds = parseIntSave(process.env.BCRYPT_SALT_ROUNDS, def);
  return rounds;
}