
import { UpdatePasswordDto, CreatePasswordDto, DeletePasswordDto } from './auth.dto.js';

export interface CredentialsDaoShape {
  create(data: CreatePasswordDto): Promise<void>;
  updatePassword(data: UpdatePasswordDto): Promise<void>;
  findByUserId(userId: number): Promise<string | null>;
  deleteByUserId(userId: DeletePasswordDto): Promise<void>;
}