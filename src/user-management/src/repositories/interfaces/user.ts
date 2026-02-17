import { User } from '../../../generated/prisma/client.js';
import { 
  CreateUserDto,
  CreatedUserDto,
  DeleteUserDto,
  UpdateUserEmailDto,
  UpdateUserNameDto,
  UpdatedUserStatusDto,
  FindUniqueUserDto,
  FindManyUserDto
} from '../../dto/user.js';

export interface IUserRepository {
  create(data: CreateUserDto): Promise<CreatedUserDto>;
  delete(data: DeleteUserDto): Promise<void>;
  updateName(data: UpdateUserNameDto): Promise<void>;
  updateEmail(data: UpdateUserEmailDto): Promise<void>;
  updateStatus(data: UpdatedUserStatusDto): Promise<void>;
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByName(name: string): Promise<User | null>;
  findByStatus(data: FindManyUserDto): Promise<User[] | null>;
}