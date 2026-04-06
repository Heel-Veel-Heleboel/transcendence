export interface IMatchmakingStatus {
  state: string;
  poolGameMode: string | null;
  activeMatchId: string | null;
  activeTournamentId: number | null;
  tournamentStatus: string | null;
  isCreator: boolean;
}

export interface ITournament {
  createdAt: string;
  createdBy: number;
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
