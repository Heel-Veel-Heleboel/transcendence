import { AxiosRequestConfig } from 'axios';
import api from './api';
import { IAck, IMessage } from '../types/chat';

export class ChatService {
  private base: string;

  constructor() {
    this.base = 'chat';
  }

  async getChannels() {
    const config = {
      url: this.base + '/channels',
      method: 'GET'
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async getChannelMessages(channelId: string) {
    const config = {
      url: this.base + `/channels/${channelId}/messages`,
      method: 'GET'
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async setAck(data: IAck) {
    const config = {
      url: this.base + `/match-ack/${data.messageId}/respond`,
      method: 'POST',
      data: { acknowledge: data.response }
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async sendMessage(data: IMessage) {
    const config = {
      url: this.base + `/channels/${data.channelId}/messages`,
      method: 'POST',
      data: { content: data.content }
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }
}
