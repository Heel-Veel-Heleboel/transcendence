export interface IChatService {
  getChannels: () => Promise<Array<IChat>>;
  getChannelMessages: (channelId: string) => Promise<Array<IChatMessage>>;
  setAck: (data: IAck) => Promise<void>;
}

export interface IAck {
  messageId: string;
  response: boolean;
}

export interface IChat {
  id: string;
  unreadCount: number;
}

export interface IChatMessage {
  channelId: string;
  content: string;
  createdAt: string;
  id: string;
  metadata: string;
  senderId: number;
  type: string;
}
