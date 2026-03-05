import { IProfileRepository } from './interfaces/profile.js';
import { PrismaClient, Profile } from '../../generated/prisma/client.js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import * as UserManagementError from '../error/user-management.js';
import * as ErrorMessages from '../constants/error-messages.js'; 


import { 
  FindProfileDto,
  UpdateStatsDto,
  UploadAvatarDto
} from '../dto/profile.js';



export class ProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserId(data: FindProfileDto): Promise<Profile | null> {
    try {
      const profile = await this.prisma.profile.findUnique({
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
      return profile;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw UserManagementError.ProfileNotFoundError;
        }
        throw UserManagementError.DatabaseError;
      }
      throw error;  
    }
  }

  async updateStats(data: UpdateStatsDto): Promise<void> {
    try {
      await this.prisma.profile.update({
        where: {
          user_id: data.user_id
        },
        data: {
          wins: data.wins ? { increment: 1 } : undefined,
          losses: data.losses ? { increment: 1 } : undefined
        }
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw UserManagementError.ProfileNotFoundError;
        }
        throw new UserManagementError.DatabaseError(ErrorMessages.ProfileDomainErrorMessages.FAILED_TO_UPDATE_PROFILE_STATS);
      }
      throw error;  
    }
  }

  async uploadAvatar(data: UploadAvatarDto): Promise<string | null> {
    try {
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
    catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw UserManagementError.ProfileNotFoundError;
        }
        throw new UserManagementError.DatabaseError(ErrorMessages.ProfileDomainErrorMessages.FAILED_TO_UPLOAD_PROFILE_AVATAR);
      }
      throw error;  
    }
  }
}