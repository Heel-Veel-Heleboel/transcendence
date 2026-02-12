export interface FindProfileDto {
  user_id: number;
}

export interface UpdateBioDto {
  user_id: number;
  bio: string;
}

export interface UpdateStatsDto {
  user_id: number;
  wins: number;
  losses: number;
  win_rate: number;
}

export interface UploadAvatarDto {
  user_id: number;
  avatar_url: string | null;
}

