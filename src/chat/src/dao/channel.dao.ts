import { PrismaClient, type ChannelType } from '../../generated/prisma/client.js';

export class ChannelDao {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: {
    type: ChannelType;
    name?: string;
    createdBy?: number;
    memberIds: number[];
  }) {
    return this.prisma.channel.create({
      data: {
        type: data.type,
        name: data.name,
        createdBy: data.createdBy,
        members: {
          create: data.memberIds.map(userId => ({ userId }))
        }
      },
      include: { members: true }
    });
  }

  async findById(channelId: string) {
    return this.prisma.channel.findFirst({
      where: { id: channelId, deletedAt: null },
      include: { members: true }
    });
  }

  async findDMBetweenUsers(userA: number, userB: number) {
    return this.prisma.channel.findFirst({
      where: {
        type: 'DM',
        deletedAt: null,
        AND: [
          { members: { some: { userId: userA } } },
          { members: { some: { userId: userB } } }
        ]
      },
      include: { members: true }
    });
  }

  async findByUserId(userId: number) {
    return this.prisma.channel.findMany({
      where: {
        deletedAt: null,
        members: { some: { userId } }
      },
      include: {
        members: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async addMember(channelId: string, userId: number) {
    return this.prisma.channelMember.create({
      data: { channelId, userId }
    });
  }

  async removeMember(channelId: string, userId: number) {
    return this.prisma.channelMember.deleteMany({
      where: { channelId, userId }
    });
  }

  async isMember(channelId: string, userId: number): Promise<boolean> {
    const member = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } }
    });
    return member !== null;
  }

  async getMemberIds(channelId: string): Promise<number[]> {
    const members = await this.prisma.channelMember.findMany({
      where: { channelId },
      select: { userId: true }
    });
    return members.map((m: { userId: number }) => m.userId);
  }

  async markRead(channelId: string, userId: number) {
    return this.prisma.channelMember.update({
      where: { channelId_userId: { channelId, userId } },
      data: { lastReadAt: new Date() }
    });
  }

  async delete(channelId: string) {
    return this.prisma.channel.update({
      where: { id: channelId },
      data: { deletedAt: new Date() }
    });
  }
}
