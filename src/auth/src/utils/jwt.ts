import { default as jwt } from 'jsonwebtoken';
import { JwtPayLoadShape, DecodedJwtPayload } from '../types/jwt.js';
import { createJwtConfig } from '../config/jwt.js';
import { JWT_ISSUER, JWT_AUDIENCE, CryptoErrorMessage } from '../constants/jwt.js';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';


let JwtConfig: ReturnType<typeof createJwtConfig> | null = null;
function getJwtConfig() {
  if (!JwtConfig) {
    JwtConfig = createJwtConfig();
  }
  return JwtConfig;
}


/**
 * Generates a signed JWT access token.
 * 
 * @param payload - The payload object to encode in the token
 * @returns A signed JWT access token string
 * @throws {JsonWebTokenError} If the private key is invalid or signing fails
 * @throws {Error} If JWT configuration cannot be loaded
 */
export function generateAccessToken(payload: JwtPayLoadShape): string {
  const config = getJwtConfig();
  const token = jwt.sign(payload,
    config.privateKey, {
      algorithms: [config.algorithm],
      expiresIn: config.expirationAccessToken,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    } as jwt.SignOptions);
  return token;
}


/**
 * Verifies and decodes a JWT access token.
 * 
 * @param token - The JWT token string to verify
 * @returns The decoded token payload
 * @throws {JsonWebTokenError} If the token is invalid, expired, or verification fails
 * @throws {Error} If the public key is invalid or JWT configuration cannot be loaded
 */
export function verifyAccessToken(token: string) : DecodedJwtPayload {
  const config = getJwtConfig();
  const decoded = jwt.verify(token, config.publicKey, {
    algorithms: [config.algorithm],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE
  } as jwt.VerifyOptions);
  return decoded as unknown as DecodedJwtPayload;
}

/**
 * Generates a cryptographically secure random refresh token.
 * 
 * @param size - The size of random bytes to generate (will be hex-encoded to 2x this length)
 * @returns A hex-encoded refresh token string
 * @throws {Error} If size is <= 0
 * @throws {RangeError} If size is greater than 2^31 - 1
 * @throws {Error} If there is insufficient entropy available
 */
export function generateRefreshToken(size: number) : string {
  if (size <= 0 || size >= 2147483647) {
    throw new Error(CryptoErrorMessage.SIZE_OUT_OF_RANGE.replace('{size}', size.toString()));
  }
  const refreshToken = randomBytes(size).toString('hex');
  return refreshToken;
}

/**
 * Hashes a refresh token using the specified algorithm.
 * 
 * @param refreshToken - The refresh token to hash
 * @param algorithm - The hashing algorithm to use (e.g., 'sha256')
 * @returns The hex-encoded hash of the refresh token
 * @throws {Error} If refreshToken is empty
 * @throws {Error} If algorithm is not specified
 * @throws {Error} If the algorithm is invalid or not supported
 */
export function hashRefreshToken(refreshToken: string, algorithm: string = 'sha256') : string {
  if (!refreshToken) {
    throw new Error(CryptoErrorMessage.REFRESH_TOKEN_EMPTY);
  }
  if (!algorithm) {
    throw new Error(CryptoErrorMessage.HASHING_ALGORITHM_MISSING);
  }
  const hash = createHash(algorithm).update(refreshToken).digest('hex');
  return hash;
}

/**
 * Compares a refresh token with its hashed counterpart using timing-safe comparison.
 * 
 * @param refreshToken - The plain refresh token to compare
 * @param hashedToken - The previously hashed refresh token
 * @param algorithm - The hashing algorithm used to hash the refresh token
 * @returns true if the tokens match, false otherwise
 * @throws {TypeError} If either buffer cannot be converted or they have different lengths
 */
export function compareRefreshToken(refreshToken: string, hashedToken: string, algorithm: string = 'sha256') : boolean {
  if (!refreshToken || !hashedToken ) {
    return false;
  }
  if (!algorithm) {
    throw new Error(CryptoErrorMessage.HASHING_ALGORITHM_MISSING);
  }
  const hashToCompare = createHash(algorithm).update(refreshToken).digest('hex');
  return timingSafeEqual(Buffer.from(hashToCompare), Buffer.from(hashedToken));
}