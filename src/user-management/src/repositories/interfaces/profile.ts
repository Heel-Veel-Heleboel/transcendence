import { Profile } from '../../../generated/prisma/client.js';
import { 
  FindProfileDto,
  UpdateStatsDto,
  UploadAvatarDto
} from '../../dto/profile.js';

export interface IProfileRepository { 
  findByUserId(data: FindProfileDto): Promise<Profile | null>;
  updateStats(data: UpdateStatsDto): Promise<void>;
  uploadAvatar(data: UploadAvatarDto): Promise<string | null>;
}