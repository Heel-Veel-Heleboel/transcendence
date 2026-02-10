import { User } from '../../../generated/prisma/client.js';
import { 
  CreateUserDto,
  CreatedUserDto,
  DeleteUserDto,
  UpdateUserDto,
  UpdatedUserStatusDto,
  FindUniqueUserDto,
  FindManyUserDto
} from '../../dto/user.js';

export interface IUserRepository {
  create(data: CreateUserDto): Promise<CreatedUserDto>;
  delete(data: DeleteUserDto): Promise<void>;
  update(data: UpdateUserDto): Promise<void>;
  updateStatus(data: UpdatedUserStatusDto): Promise<void>;
  findUnique(data: FindUniqueUserDto): Promise<User | null>;
  findByStatus(data: FindManyUserDto): Promise<User[] | null>;
}