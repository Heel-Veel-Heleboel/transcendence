import { SketchProps } from '@p5-wrapper/react';
import { AxiosResponse } from 'axios';

export interface IMatchmakingStatus {
  state: string;
  poolGameMode: string | null;
  activeMatchId: string | null;
  activeTournamentId: number | null;
  tournamentStatus: string | null;
  isCreator: boolean;
}

export interface IMatch {
  id: string;
  tournamentId: number | null;
  gameMode: string;
  player1Id: number;
  player2Id: number;
  player1Username: string;
  player2Username: string;
  status: string;
  scheduledAt: Date;
  deadline: Date | null;
  player1Acknowledged: boolean;
  player2Acknowledged: boolean;
  startedAt: Date | null;
  completedAt: Date | null;
  winnerId: number | null;
  player1Score: number | null;
  player2Score: number | null;
  gameSessionId: string | null;
  resultSource: string | null;
  round: number | null;
  bracketPosition: number | null;
}

export interface ITournament {
  createdAt: string;
  createdBy: number;
  createdByUserName: string;
  gameMode: string;
  id: number;
  maxPlayers: number;
  minPlayers: number;
  name: string;
  participantCount: number;
  registrationEnd: string;
  startTime: string | null;
  status: string;
}

export const MatchmakingStatus = {
  FREE: 'free',
  IN_POOL: 'in_pool',
  MATCH_PENDING: 'match_pending_ack',
  IN_TOURNY_REGISTRATION: 'in_tournament_registration',
  IN_TOURNY_ACTIVE: 'in_tournament_active'
};

export interface ISetTournament {
  name: string;
  gameMode: string;
}

export interface IDirectChallenge {
  inviteeId: number;
  inviteeUsername: string;
  gameMode: string;
}

export interface IMatchHistoryEntry {
  matchId: string;
  opponentId: number;
  opponentUsername: string;
  isWinner: boolean;
  userScore: number;
  opponentScore: number;
  gameMode: string;
  tournamentId: number | null;
  completedAt: string;
}

export interface IMatchHistoryResponse {
  userId: number;
  matches: IMatchHistoryEntry[];
  count: number;
}

export interface IParticipants {
  count: number;
  participantIds: number[];
  tournamentId: number;
}

export interface IRanking {
  rank: number;
  userId: number;
  username: string;
  seed: string | null;
  eliminatedIn: string | null;
}

export interface IBracket {
  player1Id: number;
  player1Username: string;
  player2Id: number;
  player2Username: string;
  winnerId: number | null;
}

export interface IMatches {
  bracket: IBracket[];
  status: string;
  totalRounds: number;
  tournamentId: number;
}

export interface ITournamentSketchProps extends SketchProps {
  matches: IMatches;
}

export interface IMatchmakingService {
  getStatus: () => Promise<AxiosResponse>;
  getMatchInfo: (matchId: string) => Promise<AxiosResponse>;
  getTournamentInfo: (tournamentId: string) => Promise<AxiosResponse>;
  getTournamentRanking: (tournamentId: string) => Promise<AxiosResponse>;
  getTournamentMatches: (tournamentId: string) => Promise<AxiosResponse>;
  getTournamentParticipants: (tournamentId: string) => Promise<AxiosResponse>;
  getTournaments: () => Promise<AxiosResponse>;
  setTournament: (data: ISetTournament) => Promise<AxiosResponse>;
  cancelTournament: (tournamentId: string) => Promise<AxiosResponse>;
  registerTournament: (tournamentId: string) => Promise<AxiosResponse>;
  unregisterTournament: (tournamentId: string) => Promise<AxiosResponse>;
  joinClassic: () => Promise<AxiosResponse>;
  leaveClassic: () => Promise<AxiosResponse>;
  joinPowerup: () => Promise<AxiosResponse>;
  leavePowerup: () => Promise<AxiosResponse>;
  sendDirectChallenge: (data: IDirectChallenge) => Promise<AxiosResponse>;
  getPlayerHistory: (userId: string, limit?: number) => Promise<AxiosResponse>;
}
