import { IProfileRepository } from './interfaces/profile.js';
import { PrismaClient, Profile } from '../../generated/prisma/client.js';

import { 
  FindProfileDto,
  UpdateBioDto,
  UpdateStatsDto,
  UploadAvatarDto
} from '../dto/profile.js';


export class ProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserId(data: FindProfileDto): Promise<Profile | null> {
    return  await this.prisma.profile.findUnique({
      where: {
        user_id: data.user_id
      },
      include: {
        user: {
          select: {
            name: true,
            activity_status: true
          }
        }
      }
    });
  }

  async updateBio(data: UpdateBioDto): Promise<void> {
    await this.prisma.profile.update({
      where: {
        user_id: data.user_id
      },
      data: {
        bio: data.bio
      }
    });
  }

  async updateStats(data: UpdateStatsDto): Promise<Profile> {

    return await this.prisma.profile.update({
      where: {
        user_id: data.user_id
      },
      data: {
        wins: data.wins,
        losses: data.losses,
        win_rate: data.win_rate
      }
    });
  }

  async uploadAvatar(data: UploadAvatarDto): Promise<string | null> {
    const updatedProfile = await this.prisma.profile.update({
      where: {
        user_id: data.user_id
      },
      data: {
        avatar_url: data.avatar_url
      }
    });
    return updatedProfile.avatar_url;
  }
    
}