import { Type, Static } from '@sinclair/typebox';
import { PasswordPolicyConfig } from '../config/password.js';


export const RegistrationSchema = Type.Object({
  user_name: Type.String({ minLength: 3, maxLength: 20, pattern: '^[a-zA-Z0-9_]+$' }),
  email: Type.String({
    format: 'email'
  }),
  password: Type.String({ minLength: PasswordPolicyConfig.minLength })
});

export type RegistrationType = Static<typeof RegistrationSchema>;


export const LoginSchema = Type.Object({
  email: Type.String(),
  password: Type.String()
});

export type LoginSchemaType = Static<typeof LoginSchema>;


export const LogoutSchema = Type.Object({
  user_id: Type.Number(),
  refreshToken: Type.String()
});

export type LogoutSchemaType = Static<typeof LogoutSchema>;


export const RefreshSchema = Type.Object({
  user_id: Type.Number(),
  refreshToken: Type.String()
});

export type RefreshSchemaType = Static<typeof RefreshSchema>;


export const ChangePasswordSchema = Type.Object({
  user_id: Type.Number(),
  currentPassword: Type.String(),
  newPassword: Type.String({ minLength: PasswordPolicyConfig.minLength })
});

export type ChangePasswordSchemaType = Static<typeof ChangePasswordSchema>;


