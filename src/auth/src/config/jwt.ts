// import fs from 'fs';
import { JwtEnvSchema, type JwtConfig } from '../types/jwt.js';
import { JWT_ALGORITHM } from '../constants/jwt.js';
import { readFile } from '../utils/read-file.js';

export function createJwtConfig() : JwtConfig {

  const env = JwtEnvSchema.parse(process.env);

  
  return {
    privateKey: readFile(env.JWT_PRIVATE_KEY_PATH),
    publicKey: readFile(env.JWT_PUBLIC_KEY_PATH),
    refreshKey: readFile(env.JWT_REFRESH_KEY_PATH),
    expirationAccessToken: env.EXPIRATION_TIME_ACCESS_TOKEN,
    expirationRefreshToken: env.EXPIRATION_TIME_REFRESH_TOKEN,
    algorithm: JWT_ALGORITHM
  };

  

}