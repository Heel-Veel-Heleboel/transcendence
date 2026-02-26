import { IUserRepository } from './interfaces/user.js';
import { PrismaClient, User } from '../../generated/prisma/client.js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import * as UserError from '../error/user.js';
import { 
  CreatedUserDto,
  CreateUserDto,
  DeleteUserDto, 
  UpdateUserEmailDto,
  UpdateUserNameDto,
  UpdatedUserStatusDto,
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
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const field = error.message.includes('email') ? 'email' : error.message.includes('name') ? 'name' : 'unknown';
          if(field === 'email') {
            throw new UserError.UserAlreadyExistsError('email');
          }
          if (field === 'name') {
            throw new UserError.UserAlreadyExistsError('name');
          }
        }
        throw new UserError.DatabaseError();
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
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new UserError.UserNotFoundError();
        }
        throw new UserError.DatabaseError();
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
          throw new UserError.UserAlreadyExistsError('email');
        }
        if (error.code === 'P2025') {
          throw new UserError.UserNotFoundError();
        }
        throw new UserError.DatabaseError();
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
          throw new UserError.UserAlreadyExistsError('name');
        }
        if (error.code === 'P2025') {
          throw new UserError.UserNotFoundError();
        }
        throw new UserError.DatabaseError();
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
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new UserError.UserNotFoundError();
        }
        throw new UserError.DatabaseError();
      }
      throw error;
    }
  }
  
  async findByEmail(email: string): Promise<User | null> {
    return await this.prismaClient.user.findUnique({
      where: {
        email: email
      }
    });
  }
  
  async findByName(name: string): Promise<User | null> {
    return await this.prismaClient.user.findUnique({
      where: {
        name: name
      }
    });
  }
  
  async findById(id: number): Promise<User | null> {
    return await this.prismaClient.user.findUnique({
      where: {
        id: id
      }
    });
  }

  async findByStatus(data: FindManyUserDto): Promise<User[] | null> {
    return await this.prismaClient.user.findMany({
      where: {
        activity_status: data.activity_status
      }
    });
  }
}