/**
 * Constants related to JWT and refresh tokens.
 */
export const JWT_ALGORITHM = 'RS256' as const;
export const JWT_ISSUER = 'AuthService' as const;
export const JWT_AUDIENCE = 'TranscendenceApp' as const;
/**
 * The size in bytes of the random part of the refresh token.
 * The actual refresh token string will be twice this length in hex encoding.
 */
export const REFRESH_TOKEN_SIZE = 64 as const;
/**
 * UUID v4 regex pattern: 8-4-4-4-12 hexadecimal characters with hyphens
 * Example: 550e8400-e29b-41d4-a716-446655440000
 */
export const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const JwtSchemaErrorMessage = {
  JWT_PRIVATE_KEY_PATH_MISSING: 'Missing JWT_PRIVATE_KEY_PATH',
  JWT_PRIVATE_KEY_PATH_EMPTY: 'JWT_PRIVATE_KEY_PATH value must not be empty',
  JWT_PRIVATE_KEY_PATH_INVALID: 'JWT_PRIVATE_KEY_PATH must be a .pem file',
  JWT_PUBLIC_KEY_PATH_MISSING: 'Missing JWT_PUBLIC_KEY_PATH',
  JWT_PUBLIC_KEY_PATH_EMPTY: 'JWT_PUBLIC_KEY_PATH value must not be empty',
  JWT_PUBLIC_KEY_PATH_INVALID: 'JWT_PUBLIC_KEY_PATH must be a .pem file',
  EXPIRATION_TIME_ACCESS_TOKEN_INVALID:
    'EXPIRATION_TIME_ACCESS_TOKEN must be a number between 1-100 followed by s (seconds), h (hours), m (minutes), or d (days). Examples: 15m, 7d, 24h',
  EXPIRATION_TIME_REFRESH_TOKEN_INVALID:
    'EXPIRATION_TIME_REFRESH_TOKEN must be a number between 1-100 followed by s (seconds), h (hours), m (minutes), or d (days). Examples: 15m, 7d, 24h'
} as const;


export const CryptoErrorMessage = {
  REFRESH_TOKEN_EMPTY: 'Refresh token cannot be empty.',
  HASHING_ALGORITHM_MISSING: 'Hashing algorithm must be specified.',
  SIZE_OUT_OF_RANGE: 'The value of "size" is out of range. It must be >= 0 && <= 2147483647. Received {size}'
} as const;
