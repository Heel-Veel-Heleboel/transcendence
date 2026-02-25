import { Type, Static } from '@fastify/type-provider-typebox';
import { ActivityStatus } from '../../generated/prisma/enums.js';

//user schema

export const CreateUserSchema = Type.Object({
  user_name: Type.String({ minLength: 3, maxLength: 20, pattern: '^[a-zA-Z0-9_]+$' }),
  user_email: Type.String({
    format: 'email'
  })
});
//type for create user schema
export type CreateUserSchemaType = Static<typeof CreateUserSchema>;




export const DeleteUserSchema = Type.Object({
  user_id: Type.Number()
});
//type for delete user schema
export type DeleteUserSchemaType = Static<typeof DeleteUserSchema>;




export const UpdateUserEmailSchema = Type.Object({
  user_id: Type.Number(),
  user_email: Type.String({
    format: 'email'
  })
});
//type for update user email schema
export type UpdateUserEmailSchemaType = Static<typeof UpdateUserEmailSchema>;




export const UpdateUserNameSchema = Type.Object({
  user_id: Type.Number(),
  user_name: Type.String({ minLength: 3, maxLength: 20, pattern: '^[a-zA-Z0-9_]+$' })
});
//type for update user name schema
export type UpdateUserNameSchemaType = Static<typeof UpdateUserNameSchema>;




export const UpdateUserStatusSchema = Type.Object({
  user_id: Type.Number(),
  activity_status: Type.Enum(ActivityStatus)
});
//type for update user status schema
export type UpdateUserStatusSchemaType = Static<typeof UpdateUserStatusSchema>;


export const FindUserByIdSchema = Type.Object({
  user_id: Type.Number()
});
//type for find user by id schema
export type FindUserByIdSchemaType = Static<typeof FindUserByIdSchema>;





export const FindUserByEmailSchema = Type.Object({
  user_email: Type.String()
});
//type for find user by email schema
export type FindUserByEmailSchemaType = Static<typeof FindUserByEmailSchema>;





export const FindUserByNameSchema = Type.Object({
  user_name: Type.String()
});
//type for find user by name schema
export type FindUserByNameSchemaType = Static<typeof FindUserByNameSchema>;





export const FindUsersByStatusSchema = Type.Object({
  activity_status: Type.Optional(Type.Enum(ActivityStatus))
});
//type for find users by status schema
export type FindUsersByStatusSchemaType = Static<typeof FindUsersByStatusSchema>;


