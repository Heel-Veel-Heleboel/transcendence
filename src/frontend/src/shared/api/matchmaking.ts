import { AxiosRequestConfig } from 'axios';
import api from './api';

export class MatchmakingService {
  private base: string;

  constructor() {
    this.base = 'matchmaking';
  }

  async getStatus() {
    const config = {
      url: this.base + '/status/me',
      method: 'GET'
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async getMatchInfo(matchId: string) {
    const config = {
      url: this.base + `/match/${matchId}`,
      method: 'GET'
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async getTournamentInfo(tournamentId: string) {
    const config = {
      url: this.base + `/tournament/${tournamentId}`,
      method: 'GET'
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async getTournaments() {
    const config = {
      url: this.base + '/tournament',
      method: 'GET'
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async cancelTournament(tournamentId: string) {
    const config = {
      url: this.base + `/tournament/${tournamentId}/cancel`,
      method: 'POST'
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async registerTournament(tournamentId: string) {
    const config = {
      url: this.base + `/tournament/${tournamentId}/register`,
      method: 'POST'
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async unregisterTournament(tournamentId: string) {
    const config = {
      url: this.base + `/tournament/${tournamentId}/unregister`,
      method: 'POST'
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async joinClassic() {
    const config = {
      url: this.base + '/classic/join',
      method: 'POST'
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async leaveClassic() {
    const config = {
      url: this.base + '/classic/leave',
      method: 'POST'
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async joinPowerup() {
    const config = {
      url: this.base + '/powerup/join',
      method: 'POST'
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }

  async leavePowerup() {
    const config = {
      url: this.base + '/powerup/leave',
      method: 'POST'
    } as AxiosRequestConfig;
    const response = await api(config);
    return response;
  }
}
