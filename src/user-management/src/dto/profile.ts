import { Profile } from '../../generated/prisma/client.js';
export interface FindProfileDto {
  user_id: number;
}

export interface ProfileResponseDto extends Profile {
  win_rate: number;
  games_played: number;
}

export interface UpdateBioDto {
  user_id: number;
  bio: string;
}

export interface UpdateStatsDto {
  user_id: number;
  wins: number;
  losses: number;
}

export interface UploadAvatarDto {
  user_id: number;
  avatar_url: string | null;
}

