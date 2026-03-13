import { FastifyInstance } from 'fastify';
import { ProfileController } from '../controllers/profile.js';
import * as ProfileSchema from '../schemas/profile.js';

export async function profileRoutes(fastify: FastifyInstance, options: { profController: ProfileController }) {
  const { profController } = options;

  fastify.get('/find-by-id/:user_id', {
    schema: { params: ProfileSchema.FindProfileSchema },
    handler: profController.getProfileByUserId.bind(profController)
  });

  fastify.post('/upload-avatar/:user_id', {
    schema: { params: ProfileSchema.UploadAvatarSchema },
    handler: profController.uploadAvatar.bind(profController)
  });

  fastify.patch('/update-stats', {
    schema: { body: ProfileSchema.UpdateProfileStatsSchema },
    handler: profController.updateProfileStats.bind(profController)
  });
}
