import { type FallbackProps } from 'react-error-boundary';
export interface IUserResponse {
  id: number;
  email: string;
  name: string;
}

export type FallbackErrorProps = Omit<FallbackProps, 'error'> & {
  error: any;
};
