import { IUserStatus } from './user';

export interface IGetProfile {
  userId: string;
}

export interface IGetProfileAvatar {
  avatarUrl: string;
}

export interface ISetProfileAvatar {
  userId: string;
  data: FormData;
}

export interface IProfile {
  avatar_url: string;
  created_at: string;
  games_played: number;
  id: number;
  losses: number;
  updated_at: string;
  user: IUserStatus;
  user_id: number;
  win_rate: number;
  wins: number;
}
