import { IProfile } from '../types/profile';
import { IUser, IUserStatus } from '../types/user';

export const DEFAULT_AVATAR = '/snake_codec.png';

export const DEFAULT_USER_STATUS: IUserStatus = {
  activity_status: 'OFFLINE',
  name: 'mysterio'
};

export const DEFAULT_PROFILE: IProfile = {
  avatar_url: DEFAULT_AVATAR,
  created_at: '0',
  games_played: 0,
  id: 0,
  losses: 0,
  updated_at: '0',
  user: DEFAULT_USER_STATUS,
  user_id: 0,
  win_rate: 0,
  wins: 0
};

export const DEFAULT_USER: IUser = {
  id: 0,
  email: 'mysterio@myster.io',
  name: 'mysterio'
};
