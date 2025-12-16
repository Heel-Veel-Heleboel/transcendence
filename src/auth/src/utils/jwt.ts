import { default as jwt } from 'jsonwebtoken';
import { PayLoadShape } from '../types/jwt.js';
import { JwtConfig } from '../config/jwt.js';
import { JWT_ISSUER, JWT_AUDIENCE } from '../constants/jwt.js';



export function generateAccessToken(payload: PayLoadShape): string {
  const token = jwt.sign(payload,
    JwtConfig.privateKey as jwt.Secret, {
      algorithm: JwtConfig.algorithm as jwt.Algorithm,
      expiresIn: JwtConfig.expirationAccessToken,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    } as jwt.SignOptions);

  return token;
}
