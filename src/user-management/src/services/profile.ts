
import { ProfileRepository } from '../repositories/profile.js';
import { ProfileResponseDto } from '../dto/profile.js';
import { ApiGatewayClient } from '../client/api-gateway.js';


export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly apiGatewayClient: ApiGatewayClient
  ) {}

  async getProfileByUserId(user_id: number) : Promise<ProfileResponseDto | null> {
    const profile = await this.profileRepository.findByUserId({ user_id });
    if (!profile) {
      return null;
    }
    const games_played = profile.wins + profile.losses;
    const win_rate = games_played > 0 ? profile.wins / games_played * 100 : 0;
    return {
      ...profile,
      win_rate,
      games_played
    };
  }

  
  async updateProfileStats(user_id: number, is_winner: boolean): Promise<void> {
    if (is_winner) {
      await this.profileRepository.updateWins({ user_id });
    } else {
      await this.profileRepository.updateLosses({ user_id });
    }
  }


  async uploadUrl(user_id: number, pub_url: string) : Promise<string | null> {
    const result = await this.profileRepository.uploadAvatarUrl({ user_id: user_id, avatar_url: pub_url });
    await this.apiGatewayClient.notifyUsers([user_id], { type: 'USER_AVATAR_UPDATED', user_id, avatar_url: pub_url });
    return result;
  }
}