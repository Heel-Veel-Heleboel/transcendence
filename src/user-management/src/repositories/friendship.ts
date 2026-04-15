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
  FindAllByStatusForUserDto,
  IsBlockedDto,
  FriendshipDto,
  BlockUserDto
} from '../dto/friendship.js';



export class FriendshipRepository implements IFriendshipRepository {
  constructor(private readonly prisma: PrismaClient) {}



  async create(data: CreateFriendshipDto): Promise<Friendship> {
    try {
      return await this.prisma.friendship.create({
        data: {
          requester_id: data.requester_id,
          addressee_id: data.addressee_id,
          status: data.status ?? 'PENDING'
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
      include: {
        requester: true,
        addressee: true
      },
      where: {
        OR: [
          { requester_id: data.userId1, addressee_id: data.userId2 },
          { requester_id: data.userId2, addressee_id: data.userId1 }
        ]
      }
    });
  }



  async findAllForUser(data: FindAllForUserDto): Promise<Friendship[]> {
    return await this.prisma.friendship.findMany({
      include: {
        requester: true,
        addressee: true
      },
      where: {
        OR: [
          { requester_id: data.userId },
          { addressee_id: data.userId }
        ]
      }
    });
  }



  async findAllByStatusForUser(data: FindAllByStatusForUserDto): Promise<Friendship[]> {
    return await this.prisma.friendship.findMany({
      include: {
        requester: true,
        addressee: true
      },
      where: {
        OR: [
          { requester_id: data.userId, status: data.status },
          { addressee_id: data.userId, status: data.status }
        ]
      }
    });
  }

  // Returns the BLOCKED record where blocker_id is the requester (directional lookup)
  async findDirectionalBlock(blocker_id: number, blocked_id: number): Promise<Friendship | null> {
    return this.prisma.friendship.findFirst({
      where: {
        requester_id: blocker_id,
        addressee_id: blocked_id,
        status: 'BLOCKED'
      }
    });
  }

  // Returns true if blocker_id has blocked target_id (directional)
  async isBlockedBy(data: IsBlockedDto): Promise<boolean> {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        requester_id: data.blocker_id,
        addressee_id: data.target_id,
        status: 'BLOCKED'
      }
    });
    return !!friendship;
  }

  // Creates or updates a relationship so that blocker_id is the requester with BLOCKED status.
  // If a friendship already exists in either direction, it is replaced with a new directional block.
  // Delete + create are wrapped in a transaction to prevent data loss on concurrent writes.
  async blockUser(data: BlockUserDto): Promise<Friendship> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.friendship.deleteMany({
          where: {
            OR: [
              { requester_id: data.blocker_id, addressee_id: data.blocked_id },
              { requester_id: data.blocked_id, addressee_id: data.blocker_id }
            ]
          }
        });
        return tx.friendship.create({
          data: {
            requester_id: data.blocker_id,
            addressee_id: data.blocked_id,
            status: 'BLOCKED'
          }
        });
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new Error.DatabaseError('Error blocking user');
      }
      throw error;
    }
  }
}
