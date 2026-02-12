import { Profile } from '../../../generated/prisma/client.js';
import { 
  FindProfileDto,
  UpdateBioDto,
  UpdateStatsDto,
  UploadAvatarDto
} from '../../dto/profile.js';

export interface IProfileRepository { 
  findByUserId(data: FindProfileDto): Promise<Profile | null>;
  updateBio(data: UpdateBioDto): Promise<void>;
  updateStats(data: UpdateStatsDto): Promise<Profile>;
  uploadAvatar(data: UploadAvatarDto): Promise<string | null>;
}