// import fs from 'fs';
import { JwtEnvSchema } from '../schemas/jwt.js';
import { JwtConfigShape } from '../types/jwt.js';
import { JWT_ALGORITHM, JWT_AUDIENCE, JWT_ISSUER } from '../constants/jwt.js';
import { readFile } from '../utils/read-file.js';

export function createJwtConfig() : JwtConfigShape {
  const env = JwtEnvSchema.parse(process.env);
  return {
    privateKey: readFile(env.JWT_PRIVATE_KEY_PATH),
    publicKey: readFile(env.JWT_PUBLIC_KEY_PATH),
    expirationAccessToken: env.EXPIRATION_TIME_ACCESS_TOKEN,
    expirationRefreshToken: env.EXPIRATION_TIME_REFRESH_TOKEN,
    algorithm: JWT_ALGORITHM,
    audience: JWT_AUDIENCE,
    issuer: JWT_ISSUER
  };
}

let jwtConfigCache: JwtConfigShape | null = null;

export function getJwtConfig(): JwtConfigShape {
  if (!jwtConfigCache) {
    jwtConfigCache = createJwtConfig();
  }
  return jwtConfigCache;
}