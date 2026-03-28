import { Type, Static } from '@fastify/type-provider-typebox';
import { FriendshipStatus  } from '../../generated/prisma/client.js';

export const CreateFriendshipSchema = Type.Object({
  user1_id: Type.Number(),
  user2_id: Type.Number(),
  status: Type.Optional(Type.Enum(FriendshipStatus))
}); 

export type CreateFriendshipSchemaType = Static<typeof CreateFriendshipSchema>;

export const FriendshipSchema = Type.Object({
  userId1: Type.Number(),
  userId2: Type.Number()
}); 

export type FriendshipSchemaType = Static<typeof FriendshipSchema>;



export const DeleteFriendshipSchema = Type.Object({
  id: Type.Number()
});

export type DeleteFriendshipSchemaType = Static<typeof DeleteFriendshipSchema>;




export const UpdateFriendshipStatusSchema = Type.Object({
  id: Type.Number(),
  status: Type.Enum(FriendshipStatus)
});

export type UpdateFriendshipStatusSchemaType = Static<typeof UpdateFriendshipStatusSchema>;




export const GetFriendshipSchema = Type.Object({
  id: Type.Number()
});

export type GetFriendshipSchemaType = Static<typeof GetFriendshipSchema>;




export const FindAllForUserSchema = Type.Object({
  userId: Type.Number()
});

export type FindAllForUserSchemaType = Static<typeof FindAllForUserSchema>;




export const IsBlockedSchema = Type.Object({
  userId1: Type.Number(),
  userId2: Type.Number()
});

export type IsBlockedSchemaType = Static<typeof IsBlockedSchema>;




export const FindAllByStatusForUserSchema = Type.Object({
  userId: Type.Number(),
  status: Type.Enum(FriendshipStatus)
});

export type FindAllByStatusForUserSchemaType = Static<typeof FindAllByStatusForUserSchema>; 
