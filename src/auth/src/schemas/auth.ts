import { Type, Static } from '@sinclair/typebox';
import { PasswordPolicyConfig } from '../config/password.js';

//registration schema
export const RegistrationSchemaBody = Type.Object({
  user_name: Type.String({
    minLength: 3,
    maxLength: 20,
    pattern: '^[a-zA-Z0-9_]+$'
  }),
  email: Type.String({
    format: 'email'
  }),
  password: Type.String({ minLength: PasswordPolicyConfig.minLength })
});
// type for registration schema
export type RegistrationSchemaType = Static<typeof RegistrationSchemaBody>;
//wrap and export registration schema for routes
export const RegistrationSchema = {
  body: RegistrationSchemaBody
};

//login schema
export const LoginSchemaBody = Type.Object({
  email: Type.String(),
  password: Type.String()
});
//type for login schema
export type LoginSchemaType = Static<typeof LoginSchemaBody>;
//wrap and export login schema for routes
export const LoginSchema = {
  body: LoginSchemaBody
};

//logout schema
export const LogoutSchemaBody = Type.Object({
  user_id: Type.Number()
});
//type for logout schema
export type LogoutSchemaType = Static<typeof LogoutSchemaBody>;
//wrap and export logout schema for routes
export const LogoutSchema = {
  body: LogoutSchemaBody
};

//refresh schema
export const RefreshSchemaBody = Type.Object({
  user_id: Type.Number()
});
//type for refresh schema
export type RefreshSchemaType = Static<typeof RefreshSchemaBody>;
//wrap and export refresh schema for routes
export const RefreshSchema = {
  body: RefreshSchemaBody
};

//change password schema
export const ChangePasswordSchemaBody = Type.Object({
  user_id: Type.Number(),
  current_password: Type.String(),
  new_password: Type.String({ minLength: PasswordPolicyConfig.minLength })
});
//type for change password schema
export type ChangePasswordSchemaType = Static<typeof ChangePasswordSchemaBody>;
//wrap and export change password schema for routes
export const ChangePasswordSchema = {
  body: ChangePasswordSchemaBody
};


//delete auth data schema
export const DeleteAuthDataSchemaBody = Type.Object({
  user_id: Type.Number()
});
//type for delete auth data schema
export type DeleteAuthDataSchemaType = Static<typeof DeleteAuthDataSchemaBody>;
//wrap and export delete auth data schema for routes
export const DeleteAuthDataSchema = {
  body: DeleteAuthDataSchemaBody
};

