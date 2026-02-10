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

export interface UserRepository {
  create(data: CreateUserDto): Promise<CreatedUserDto>;
  delete(data: DeleteUserDto): Promise<void>;
  update(data: UpdateUserDto): Promise<void>;
  updateSatus(data: UpdatedUserStatusDto): Promise<void>;
  findUnique(data: FindUniqueUserDto): Promise<User | null>;
  findMany(data: FindManyUserDto): Promise<User[]>;
}