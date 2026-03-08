import { Type, Static } from '@fastify/type-provider-typebox';

export const FindProfileSchema = Type.Object({
  user_id: Type.Number()
});

export type FindProfileSchemaType = Static<typeof FindProfileSchema>;


export const UploadAvatarSchema = Type.Object({
  user_id: Type.Number()
});

export type UploadAvatarSchemaType = Static<typeof UploadAvatarSchema>;



export const UpdateProfileStatsSchema = Type.Object({
  user_id: Type.Number(),
  is_winner: Type.Boolean()
});

export type UpdateProfileStatsSchemaType = Static<typeof UpdateProfileStatsSchema>; 