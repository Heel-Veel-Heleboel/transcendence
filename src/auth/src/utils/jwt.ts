import { default as jwt } from 'jsonwebtoken';
import { PayLoadShape, DecodedJwtPayload } from '../types/jwt.js';
import { createJwtConfig } from '../config/jwt.js';
import { JWT_ISSUER, JWT_AUDIENCE } from '../constants/jwt.js';
import { randomBytes, createHash } from 'crypto';

const JwtConfig = createJwtConfig();

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

export function generateRefreshToken() : string {
  const refreshToken = randomBytes(64).toString('hex');
  return refreshToken;
}

export function hashRefreshToken(refreshToken: string) : string {
  const hash = createHash('sha256').update(refreshToken).digest('hex');
  return hash;
}

export function compareRefreshToken(refreshToken: string, hashedToken: string) : boolean {
  const hashToCompare = createHash('sha256').update(refreshToken).digest('hex');
  return hashToCompare === hashedToken;
}