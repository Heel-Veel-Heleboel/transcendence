import { IUserStatus } from './user';

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
