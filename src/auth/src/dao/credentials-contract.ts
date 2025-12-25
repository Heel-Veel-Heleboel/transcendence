
import { UpdatePasswordDto, CreatePasswordDto, DeletePasswordDto, FindPasswordDto } from './auth.dto.js';

export interface CredentialsDaoShape {
  create(data: CreatePasswordDto): Promise<void>;
  updatePassword(data: UpdatePasswordDto): Promise<void>;
  findByUserId(data: FindPasswordDto): Promise<string | null>;
  deleteByUserId(data: DeletePasswordDto): Promise<void>;
}