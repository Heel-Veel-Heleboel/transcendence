export const JWT_ALGORITHM = 'RS256' as const;
export const JWT_ISSUER = 'AuthService' as const;
export const JWT_AUDIENCE = 'TranscendenceApp' as const;


export const JwtSchemaErrorMessage = {
  JWT_PRIVATE_KEY_PATH_MISSING: 'Missing JWT JWT_PRIVATE_KEY_PATH',
  JWT_PRIVATE_KEY_PATH_EMPTY: 'JWT PRIVATE_KEY_PATH value must not be empty',
  JWT_PRIVATE_KEY_PATH_INVALID: 'JWT private key path must be a .pem file',
  JWT_PUBLIC_KEY_PATH_MISSING: 'Missing JWT JWT_PUBLIC_KEY_PATH',
  JWT_PUBLIC_KEY_PATH_EMPTY: 'JWT PUBLIC_KEY_PATH value must not be empty',
  JWT_PUBLIC_KEY_PATH_INVALID: 'JWT public key path must be a .pem file',
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