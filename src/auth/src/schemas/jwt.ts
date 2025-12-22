import * as z from 'zod';

import { JwtSchemaErrorMessage } from '../constants/jwt.js';

const durationSchema = (errorMessage: string) =>
  z.string().trim().regex(
    /^(100|[1-9][0-9]?)[shmd]$/,
    errorMessage
  );

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
  EXPIRATION_TIME_ACCESS_TOKEN: durationSchema(
    JwtSchemaErrorMessage.EXPIRATION_TIME_ACCESS_TOKEN_INVALID
  ).default('15m'),
  EXPIRATION_TIME_REFRESH_TOKEN: durationSchema(
    JwtSchemaErrorMessage.EXPIRATION_TIME_REFRESH_TOKEN_INVALID
  ).default('7d')
});