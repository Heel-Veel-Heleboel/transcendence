import { IFriendship } from '../types/friendship';
import { IMatch, IMatchmakingStatus } from '../types/matchmaking';
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

export const DEFAULT_FRIENDSHIP: IFriendship = {
  created_at: '0',
  id: 0,
  status: 'UNDEFINED',
  updated_at: '0',
  userId: 0,
  userName: 'mysterio',
  isRequester: false
};

export const DEFAULT_MATCH: IMatch = {
  id: '',
  tournamentId: null,
  gameMode: '',
  player1Id: 0,
  player2Id: 0,
  player1Username: '',
  player2Username: '',
  status: '',
  scheduledAt: new Date(0),
  deadline: null,
  player1Acknowledged: false,
  player2Acknowledged: false,
  startedAt: null,
  completedAt: null,
  winnerId: null,
  player1Score: null,
  player2Score: null,
  gameSessionId: null,
  resultSource: null,
  round: null,
  bracketPosition: null
};

export const DEFAULT_MATCHSTATUS: IMatchmakingStatus = {
  state: '',
  poolGameMode: null,
  activeMatchId: null,
  activeTournamentId: null,
  tournamentStatus: null,
  isCreator: false
};
