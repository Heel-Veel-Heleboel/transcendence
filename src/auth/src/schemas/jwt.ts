import * as z from 'zod';

const durationSchema = (fieldName: string) => z.string().trim().regex(
  /^(100|[1-9][0-9]?)[shmd]$/,
  `${fieldName} must be a number between 1-100 followed by s (seconds), h (hours), m (minutes), or d (days). Examples: 15m, 7d, 24h`
);

export const JwtEnvSchema = z.object({
  JWT_PRIVATE_KEY_PATH: z.string('Missing JWT JWT_PRIVATE_KEY_PATH').nonempty('JWT PRIVATE_KEY_PATH value must not be empty').trim().endsWith('.pem', 'JWT private key path must be a .pem file'),
  JWT_PUBLIC_KEY_PATH: z.string('Missing JWT JWT_PUBLIC_KEY_PATH').nonempty('JWT PUBLIC_KEY_PATH value must not be empty').trim().endsWith('.pem', 'JWT public key path must be a .pem file'),
  EXPIRATION_TIME_ACCESS_TOKEN: durationSchema('EXPIRATION_TIME_ACCESS_TOKEN').default('15m'),
  EXPIRATION_TIME_REFRESH_TOKEN: durationSchema('EXPIRATION_TIME_REFRESH_TOKEN').default('7d')
});