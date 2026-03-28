import { type FallbackProps } from 'react-error-boundary';
export interface IUserResponse {
  id: number;
  email: string;
  name: string;
}

export interface IChat {
  channelId: string;
  content: string;
  createdAt: string;
  id: string;
  metadata: string;
  senderId: number;
  type: string;
}

export type IFallbackErrorProps = Omit<FallbackProps, 'error'> & {
  error: any;
};
