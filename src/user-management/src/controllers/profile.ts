
import { FastifyReply, FastifyRequest } from 'fastify';
import { ProfileService } from '../services/profile.js';
import { pipeline } from 'stream';
import fs from 'fs';
import util from 'util';
import path from 'path';
import crypto  from 'crypto';
import * as ProfileSchema from '../schemas/profile.js';


const pump = util.promisify(pipeline);
const allowedExtensions = ['.png', '.jpg', '.jpeg'];

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
    console.log('Received updateProfileStats request:', { user_id, is_winner });
    request.log.info({ user_id, is_winner }, 'Update profile stats attempt');
    await this.profileService.updateProfileStats(user_id, is_winner);
    request.log.info({ user_id }, 'Profile stats updated successfully');
    return reply.send({ message: 'Profile stats updated successfully' });
  }




  async uploadAvatar(request: FastifyRequest<{ Body: ProfileSchema.UploadAvatarSchemaType }>, reply: FastifyReply): Promise<FastifyReply> {
    // Convert user_id from string to number (route params are always strings)
    // const user_id = Number(request.body.user_id);
    // if (isNaN(user_id)) {
    //   return reply.status(400).send({ message: 'Invalid user_id' });
    // }
    

    const file = await request.file();
  
    if (!file) {
      return reply.status(400).send({ message: 'No file uploaded' });
    }
    
    const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    request.log.info({ filename: file.filename }, 'File upload attempt');

    // Generate unique filename to avoid collisions
    const file_extention = path.extname(file.filename);
    if (!allowedExtensions.includes(file_extention)) {
      return reply.status(400).send({ message: 'Invalid file extension' });
    }
    const unique_filename = crypto.randomUUID() + file_extention;
    const filePath = path.join(uploadDir, unique_filename);
    
    // Save file to disk
    await pump(file.file, fs.createWriteStream(filePath));
    request.log.info({ filename: unique_filename }, 'File uploaded successfully');

    // Create public URL and store in database
    const pub_url = `${process.env.PREFIX || '/uploads/'}${unique_filename}`;
    const result = await this.profileService.uploadUrl(request.body.user_id, pub_url);
    request.log.info({ user_id: request.body.user_id, pub_url }, 'Avatar URL stored in database');

    return reply.code(200).send({
      message: 'Avatar uploaded successfully',
      avatar_url: result
    });
  }
}