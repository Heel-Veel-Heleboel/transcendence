
import { FastifyReply, FastifyRequest } from 'fastify';
import { ProfileService } from '../services/profile.js';
import { pipeline } from 'stream';
import fs from 'fs';
import util from 'util';
import path from 'path';
import crypto  from 'crypto';
import * as ProfileSchema from '../schemas/profile.js';


const pump = util.promisify(pipeline);
const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];

export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}



  
  async getProfileByUserId(request: FastifyRequest<{ Params: ProfileSchema.FindProfileSchemaType }>, reply: FastifyReply): Promise<FastifyReply> {
    const { user_id } = request.params;
    request.log.info({ user_id }, 'Get profile by user ID attempt');
    const profile = await this.profileService.getProfileByUserId(user_id);
    if (!profile) {
      return reply.status(404).send({ message: 'Profile not found' });
    }
    request.log.info({ user_id }, 'Profile retrieved successfully');
    return reply.send(profile);
  }




  async updateProfileStats(request: FastifyRequest<{ Body: ProfileSchema.UpdateProfileStatsSchemaType }>, reply: FastifyReply): Promise<FastifyReply> {

    const { user_id, is_winner } = request.body;
    request.log.info({ user_id, is_winner }, 'Update profile stats attempt');
    await this.profileService.updateProfileStats(user_id, is_winner);
    request.log.info({ user_id }, 'Profile stats updated successfully');
    return reply.send({ message: 'Profile stats updated successfully' });
  }




  async uploadAvatar( request: FastifyRequest< {Params: { user_id: number }}>, reply: FastifyReply): Promise<FastifyReply> {

    const file = await request.file({ limits: { fileSize: 1024 } });

    if (!file) {
      return reply.status(400).send({ message: 'No file uploaded' });
    }

    const user_id = request.params.user_id;

    const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });

    const file_extension = path.extname(file.filename).toLowerCase();

    if (!file.mimetype.startsWith('image/')) {
      file.file.resume();
      return reply.status(400).send({ message: 'Invalid file type' });
    }

    if (!allowedExtensions.includes(file_extension)) {
      file.file.resume(); 
      return reply.status(400).send({ message: 'Invalid file extension' });
    }

    const unique_filename = crypto.randomUUID() + file_extension;
    const filePath = path.join(uploadDir, unique_filename);

    try {
      await pump(file.file, fs.createWriteStream(filePath));
    } catch (error) {
      await fs.promises.unlink(filePath).catch(() => {});
      request.log.error({ error }, 'Error uploading file');
      return reply.status(500).send({ message: 'Upload failed' });
    }

    if (file.file.truncated) {
      await fs.promises.unlink(filePath).catch(() => {});
      return reply.code(413).send({ message: 'File too large' });
    }

    const pub_url = `${process.env.PREFIX || '/uploads/'}${unique_filename}`;
    const result = await this.profileService.uploadUrl(user_id, pub_url);

    return reply.code(200).send({
      message: 'Avatar uploaded successfully',
      avatar_url: result
    });
  }
}
