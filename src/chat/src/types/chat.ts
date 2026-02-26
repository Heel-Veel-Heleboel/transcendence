export interface CreateDMChannelRequest {
  targetUserId: number;
}

export interface CreateGroupChannelRequest {
  name: string;
  memberIds: number[];
}

export interface CreateChannelRequest {
  type: 'DM' | 'GROUP';
  targetUserId?: number;
  name?: string;
  memberIds?: number[];
}

export interface SendMessageRequest {
  content: string;
}

export interface MatchAckMetadata {
  matchId: string;
  gameMode: string;
  opponentId: number;
  expiresAt: string;
  status: 'pending' | 'acknowledged' | 'expired';
}

export interface RespondToMatchAckRequest {
  acknowledge: boolean;
}

export interface PaginationQuery {
  cursor?: string;
  limit?: number;
}

export interface CreateGameSessionChannelRequest {
  playerIds: number[];
  gameSessionId: string;
}

export interface CreateTournamentChannelRequest {
  userId: number;
  tournamentId: number;
  tournamentName: string;
}

export interface SendMatchAckRequest {
  matchId: string;
  playerIds: number[];
  gameMode: string;
  expiresAt: string;
}

export interface SystemMessageRequest {
  content: string;
}

export interface WebSocketEvent {
  type: string;
  [key: string]: unknown;
}
