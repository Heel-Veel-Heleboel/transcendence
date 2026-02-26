import { z } from 'zod';

export const ServerConfigSchema = z.object({
  PORT: z.string()
    .regex(/^\d+$/, 'PORT must be a number')
    .transform(Number)
    .refine((port) => port > 0 && port <= 65535, {
      message: 'PORT must be between 1 and 65535'
    }),
  
  HOST: z.string()
    .min(1, 'HOST cannot be empty')
    .refine((host) => {
      return /^(localhost|[\w.-]+|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.test(host);
    }, {
      message: 'HOST must be a valid hostname or IP address'
    }),
  
  USER_MANAGEMENT_URL: z.string()
    .url('USER_MANAGEMENT_URL must be a valid URL')
    .startsWith('http', 'USER_MANAGEMENT_URL must start with http:// or https://')
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;