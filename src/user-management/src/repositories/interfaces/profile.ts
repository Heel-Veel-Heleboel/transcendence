import { Profile } from '../../../generated/prisma/client.js';
import { 
  FindProfileDto,
  UploadAvatarDto
} from '../../dto/profile.js';

export interface IProfileRepository { 
  findByUserId(data: FindProfileDto): Promise<Profile | null>;
  // updateStats(data: UpdateStatsDto): Promise<void>;
  updateWins(user_id: number): Promise<void>;
  updateLosses(user_id: number): Promise<void>;
  uploadAvatarUrl(data: UploadAvatarDto): Promise<string | null>;
}