
import { ProfileRepository } from '../repositories/profile.js';
import { ProfileResponseDto } from '../dto/profile.js';



export class ProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async getProfileByUserId(user_id: number) : Promise<ProfileResponseDto | null> {
    const profile = await this.profileRepository.findByUserId({ user_id });
    if (!profile) {
      return null;
    }
    const games_played = profile.wins + profile.losses;
    const win_rate = games_played > 0 ? profile.wins / games_played : 0;
    return {
      ...profile,
      win_rate,
      games_played
    };
  }

  
  async updateProfileStats(user_id: number, is_winner: boolean): Promise<void> {
    await this.profileRepository.updateStats({
      user_id,
      wins: is_winner ? 1 : 0,
      losses: is_winner ? 0 : 1
    });
  }
}