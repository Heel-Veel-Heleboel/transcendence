import * as z from 'zod';

import { JwtSchemaErrorMessage } from '../constants/jwt.js';

const multipliers: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000
};

const toMs = (val: string): number => {
  const unit = val.slice(-1);
  const num = parseInt(val, 10);
  return num * multipliers[unit];
};

export const JwtEnvSchema = z.object({
  JWT_PRIVATE_KEY_PATH: z
    .string({ message: JwtSchemaErrorMessage.JWT_PRIVATE_KEY_PATH_MISSING })
    .nonempty(JwtSchemaErrorMessage.JWT_PRIVATE_KEY_PATH_EMPTY)
    .trim()
    .endsWith('.pem', JwtSchemaErrorMessage.JWT_PRIVATE_KEY_PATH_INVALID),
  JWT_PUBLIC_KEY_PATH: z
    .string({ message: JwtSchemaErrorMessage.JWT_PUBLIC_KEY_PATH_MISSING })
    .nonempty(JwtSchemaErrorMessage.JWT_PUBLIC_KEY_PATH_EMPTY)
    .trim()
    .endsWith('.pem', JwtSchemaErrorMessage.JWT_PUBLIC_KEY_PATH_INVALID),
  EXPIRATION_TIME_ACCESS_TOKEN : z
    .string()
    .trim()
    .regex(
      /^(100|[1-9][0-9]?)[shmd]$/,
      JwtSchemaErrorMessage.EXPIRATION_TIME_ACCESS_TOKEN_INVALID
    )
    .default('15m').transform(toMs),
  EXPIRATION_TIME_REFRESH_TOKEN: z
    .string()
    .trim()
    .regex(
      /^(100|[1-9][0-9]?)[shmd]$/,
      JwtSchemaErrorMessage.EXPIRATION_TIME_REFRESH_TOKEN_INVALID
    )
    .default('7d').transform(toMs)
});