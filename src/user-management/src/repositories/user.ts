import { IUserRepository } from './interfaces/user.js';
import { PrismaClient, User } from '../../generated/prisma/client.js';
import { 
  CreatedUserDto,
  CreateUserDto,
  DeleteUserDto, 
  UpdateUserDto,
  UpdatedUserStatusDto,
  FindUniqueUserDto,
  FindManyUserDto
} from '../dto/user.js';

export class UserRepository implements IUserRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async create(data: CreateUserDto): Promise<CreatedUserDto> {
    const user = await this.prismaClient.user.create({
      data: {
        email: data.email,
        name: data.name
      }
    });
    return { id: user.id };
  }

  async delete(data: DeleteUserDto): Promise<void> {
    await this.prismaClient.user.delete({
      where: {
        id: data.id
      }
    });
  }


  async update(data: UpdateUserDto): Promise<void> {
    await this.prismaClient.user.update({
      where: {
        id: data.id
      },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.name && { name: data.name })
      }
    });
  }


  async updateStatus(data: UpdatedUserStatusDto): Promise<void> {
    await this.prismaClient.user.update({
      where: {
        id: data.id
      },
      data: {
        activity_status: data.activity_status
      }
    });
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

  async findByStatus(data: FindManyUserDto): Promise<User[] | null> {
    return await this.prismaClient.user.findMany({
      where: {
        activity_status: data.activity_status
      }
    });
  }
}