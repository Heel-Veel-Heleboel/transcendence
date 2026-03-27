import { IFriendshipRepository } from './interfaces/friendship.js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PrismaClient, Friendship } from '../../generated/prisma/client.js';
import * as Error from '../error/user-management.js';
import {
  CreateFriendshipDto,
  DeleteFriendshipDto,
  GetFriendshipDto,
  UpdateFriendshipStatusDto,
  FindAllForUserDto,
  // FindAllPendingForUserDto,
  // FindAllAcceptedForUserDto,
  // FindAllBlockedForUserDto,
  FindAllByStatusForUserDto,
  IsBlockedDto,
  FriendshipDto
} from '../dto/friendship.js';



export class FriendshipRepository implements IFriendshipRepository {
  constructor(private readonly prisma: PrismaClient) {}



  async create(data: CreateFriendshipDto): Promise<Friendship> {
    try {
      return await this.prisma.friendship.create({
        data: {
          user1_id: data.user1_id,
          user2_id: data.user2_id,
          status:'PENDING'
        }
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error.FriendshipAlreadyExistsError();
        }
        throw new Error.DatabaseError('Error creating friendship');
      }
      throw error;
    }
  }



  async delete(data: DeleteFriendshipDto): Promise<void> {
    try {
      await this.prisma.friendship.delete({
        where: { id: data.id }
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error.FriendshipNotFoundError();
        }
        throw new Error.DatabaseError('Error deleting friendship');
      }
      throw error;
    }
  }



  async updateStatus(data: UpdateFriendshipStatusDto): Promise<Friendship> {
    try {
      return await this.prisma.friendship.update({
        where: { id: data.id },
        data: { status: data.status }
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error.FriendshipNotFoundError();
        }
      }
      throw new Error.DatabaseError('Error updating friendship status');
    }
  }



  async findById(data: GetFriendshipDto): Promise<Friendship | null> {
    return await this.prisma.friendship.findUnique({
      where: { id: data.id }
    });
  }

  async findBetween(data: FriendshipDto): Promise<Friendship | null> {
    return await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { user1_id: data.userId1, user2_id: data.userId2 },
          { user1_id: data.userId2, user2_id: data.userId1 }
        ]
      }
    });
  }



  async findAllForUser(data: FindAllForUserDto): Promise<Friendship[]> {
    return await this.prisma.friendship.findMany({
      where: {
        OR: [
          { user1_id: data.userId },
          { user2_id: data.userId }
        ]
      }
    });
  }



  async findAllByStatusForUser(data: FindAllByStatusForUserDto): Promise<Friendship[]> {
    return await this.prisma.friendship.findMany({
      where: {
        OR: [
          { user1_id: data.userId, status: data.status },
          { user2_id: data.userId, status: data.status }
        ]
      }
    });
  }

  async isBlocked(data: IsBlockedDto): Promise<boolean> {
    const friendship = await this.prisma.friendship.findUnique({
      where: {
        user1_id_user2_id: {
          user1_id: data.userId1,
          user2_id: data.userId2
        },
        status: 'BLOCKED'
      }
    });
    return !!friendship;
  }
}
