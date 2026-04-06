export interface IUserStatus {
  activity_status: string;
  name: string;
}

export interface IUser {
  id: number;
  email: string;
  name: string;
}

export interface IProfile {
  avatar_url: null;
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
