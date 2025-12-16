import { default as jwt } from 'jsonwebtoken';
import { PayLoadShape, DecodedJwtPayload } from '../types/jwt.js';
import { JwtConfig } from '../config/jwt.js';
import { JWT_ISSUER, JWT_AUDIENCE } from '../constants/jwt.js';



export function generateAccessToken(payload: PayLoadShape): string {
  const token = jwt.sign(payload,
    JwtConfig.privateKey, {
      algorithm: JwtConfig.algorithm as jwt.Algorithm,
      expiresIn: JwtConfig.expirationAccessToken,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    } as jwt.SignOptions);

  return token;
}


export function verifyAccessToken(token: string) : DecodedJwtPayload {
  const decoded = jwt.verify(token, JwtConfig.publicKey, {
    algorithm: JwtConfig.algorithm as jwt.Algorithm,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE
  } as jwt.DecodeOptions
  );
  return decoded as unknown as DecodedJwtPayload;
}