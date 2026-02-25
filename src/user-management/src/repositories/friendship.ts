import { IFriendshipRepository } from './interfaces/friendship.js';

import { PrismaClient, Friendship } from '../../generated/prisma/client.js';
import {
  CreateFriendshipDto,
  DeleteFriendshipDto,
  GetFriendshipDto,
  UpdateFriendshipStatusDto,
  FindByUsersDto,
  FindAllForUserDto,
  FindAllPendingForUserDto,
  FindAllAcceptedForUserDto,
  FindAllBlockedForUserDto,
  IsBlockedDto
} from '../dto/friendship.js';


export class FriendshipRepository implements IFriendshipRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateFriendshipDto): Promise<Friendship> {
  
    return await this.prisma.friendship.create({
      data: {
        requester_id: data.requester_id,
        addressee_id: data.addressee_id,
        status: data.status || 'PENDING'
      }
    });
  }

  async delete(data: DeleteFriendshipDto): Promise<void> {
    await this.prisma.friendship.delete({
      where: { id: data.id }
    });
  }
  
  async updateStatus(data: UpdateFriendshipStatusDto): Promise<Friendship> {
    return await this.prisma.friendship.update({
      where: { id: data.id },
      data: { status: data.status }
    });
  }

  async findById(data: GetFriendshipDto): Promise<Friendship | null> {
    return await this.prisma.friendship.findUnique({
      where: { id: data.id }
    });
  }


  async findByUsers(data: FindByUsersDto): Promise<Friendship | null> {
    return await this.prisma.friendship.findUnique({
      where: {
        requester_id_addressee_id: {
          requester_id: data.userId1,
          addressee_id: data.userId2
        }
      }
    });
  }

  async findAllForUser(data: FindAllForUserDto): Promise<Friendship[]> {
    return await this.prisma.friendship.findMany({
      where: {
        OR: [
          { requester_id: data.userId },
          { addressee_id: data.userId }
        ]
      }
    });
  }

  async findAllPendingForUser(data: FindAllPendingForUserDto): Promise<Friendship[]> {
    return await this.prisma.friendship.findMany({
      where: {
        OR: [
          { requester_id: data.userId, status: 'PENDING' },
          { addressee_id: data.userId, status: 'PENDING' }
        ]
      }
    });
  }

  async findAllAcceptedForUser(data: FindAllAcceptedForUserDto): Promise<Friendship[]> {
    return await this.prisma.friendship.findMany({
      where: {
        OR: [
          { requester_id: data.userId, status: 'ACCEPTED' },
          { addressee_id: data.userId, status: 'ACCEPTED' }
        ]
      }
    });
  }

  async findAllBlockedForUser(data: FindAllBlockedForUserDto): Promise<Friendship[]> {
    return await this.prisma.friendship.findMany({
      where: {
        OR: [
          { requester_id: data.userId, status: 'BLOCKED' },
          { addressee_id: data.userId, status: 'BLOCKED' }
        ]
      }
    });
  }

  async findAll(): Promise<Friendship[]> {
    return await this.prisma.friendship.findMany();
  }

  async isBlocked(data: IsBlockedDto): Promise<boolean> {
    const friendship = await this.prisma.friendship.findUnique({
      where: {
        requester_id_addressee_id: {
          requester_id: data.userId1,
          addressee_id: data.userId2
        },
        status: 'BLOCKED'
      }
    });
    return !!friendship;
  }
}