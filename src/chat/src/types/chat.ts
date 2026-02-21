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

export interface SendGameInviteRequest {
  targetUserId: number;
  gameMode: string;
}

export interface RespondToInviteRequest {
  accept: boolean;
}

export interface GameInviteMetadata {
  gameMode: string;
  targetUserId: number;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
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

export interface SystemMessageRequest {
  content: string;
}

export interface WebSocketEvent {
  type: string;
  [key: string]: unknown;
}
