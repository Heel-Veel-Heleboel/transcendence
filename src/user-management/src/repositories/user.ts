import { IUserRepository } from './interfaces/user.js';
import { PrismaClient, User } from '../../generated/prisma/client.js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import * as UserError from '../error/user.js';
import { UserErrorMessages } from '../constants/error-messages.js';
import { 
  CreatedUserDto,
  CreateUserDto,
  DeleteUserDto, 
  UpdateUserEmailDto,
  UpdateUserNameDto,
  UpdatedUserStatusDto,
  FindUniqueUserDto,
  FindManyUserDto
} from '../dto/user.js';


export class UserRepository implements IUserRepository {
  constructor(private readonly prismaClient: PrismaClient) {}
  
  async create(data: CreateUserDto): Promise<CreatedUserDto> {
    try {
      const user = await this.prismaClient.user.create({
        data: {
          email: data.email,
          name: data.name,
          profile: {
            create: {}
          }
        },
        include: {
          profile: true
        }
      });
      return { id: user.id };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = error.meta?.target as string[] | undefined;
        if(target?.includes('email')) {
          throw new UserError.UserAlreadyExistsError(UserErrorMessages.EMAIL_ALREADY_EXISTS);
        }
        if (target?.includes('name')) {
          throw new UserError.UserAlreadyExistsError(UserErrorMessages.NAME_ALREADY_EXISTS);
        }
      }
      throw error;
    }
  }

  async delete(data: DeleteUserDto): Promise<void> {
    try {
      await this.prismaClient.user.delete({
        where: {
          id: data.id
        }
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new UserError.UserNotFoundError(UserErrorMessages.USER_NOT_FOUND);
      }
      throw error;
    }
  }


  async updateEmail(data: UpdateUserEmailDto): Promise<void> {
    try {
      await this.prismaClient.user.update({
        where: {
          id: data.id
        },
        data: {
          email: data.email
        }
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new UserError.UserAlreadyExistsError(UserErrorMessages.EMAIL_ALREADY_EXISTS);
        }
        if (error.code === 'P2025') {
          throw new UserError.UserNotFoundError(UserErrorMessages.USER_NOT_FOUND);
        }
      }
      throw error;
    }
  }


  async updateName(data: UpdateUserNameDto): Promise<void> {
    try {
      await this.prismaClient.user.update({
        where: {
          id: data.id
        },
        data: {
          name: data.name
        }
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new UserError.UserAlreadyExistsError(UserErrorMessages.NAME_ALREADY_EXISTS);
        }
        if (error.code === 'P2025') {
          throw new UserError.UserNotFoundError(UserErrorMessages.USER_NOT_FOUND);
        }
      }
      throw error;
    }
  }


  async updateStatus(data: UpdatedUserStatusDto): Promise<void> {
    try {
      await this.prismaClient.user.update({
        where: {
          id: data.id
        },
        data: {
          activity_status: data.activity_status
        }
      });
    } catch (error) { 
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new UserError.UserNotFoundError(UserErrorMessages.USER_NOT_FOUND);
      }
      throw error;
    }
  }

  async findUnique(data: FindUniqueUserDto): Promise<User | null> {
    if (data.id) {
      return await this.prismaClient.user.findUnique({
        where: {
          id: data.id
        }
      });
    } else if (data.email) {
      return await this.prismaClient.user.findUnique({
        where: {
          email: data.email
        }
      });
    } else if (data.name) {
      return await this.prismaClient.user.findUnique({
        where: {
          name: data.name
        }
      });
    } else {
      return null;
    }
  }

  async findByStatus(data: FindManyUserDto): Promise<User[]> {
    return await this.prismaClient.user.findMany({
      where: {
        activity_status: data.activity_status
      }
    });
  }
}