export interface IChatService {
  getChannels: () => Promise<Array<IChat>>;
  getChannelMessages: (channelId: string) => Promise<Array<IChatMessage>>;
  setAck: (data: IAck) => Promise<void>;
  sendMessage: (data: IMessage) => Promise<IChatMessage>;
  createOrGetDMChannel: (targetUserId: number) => Promise<IChat>;
}

export interface IAck {
  messageId: string;
  response: boolean;
}

export interface IChatMember {
  userId: number;
  username: string | null;
}

export interface IChat {
  id: string;
  type: string;
  name: string | null;
  members: IChatMember[];
  unreadCount: number;
}

export interface IMessage {
  channelId: string;
  content: string;
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
