import { Profile } from '../../../generated/prisma/client.js';
import { 
  FindProfileDto,
  UpdateStatsDto,
  UploadAvatarDto
} from '../../dto/profile.js';

export interface IProfileRepository { 
  findByUserId(data: FindProfileDto): Promise<Profile | null>;
  updateWins(data: UpdateStatsDto): Promise<void>;
  updateLosses(data: UpdateStatsDto): Promise<void>;
  uploadAvatarUrl(data: UploadAvatarDto): Promise<string | null>;
}