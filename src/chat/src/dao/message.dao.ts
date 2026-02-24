import { PrismaClient, MessageType } from '../../generated/prisma/index.js';

export class MessageDao {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: {
    channelId: string;
    senderId: number;
    content: string;
    type?: MessageType;
    metadata?: string;
  }) {
    const message = await this.prisma.message.create({
      data: {
        channelId: data.channelId,
        senderId: data.senderId,
        content: data.content,
        type: data.type ?? 'TEXT',
        metadata: data.metadata
      }
    });

    // Touch the channel's updatedAt so it sorts to the top
    await this.prisma.channel.update({
      where: { id: data.channelId },
      data: { updatedAt: new Date() }
    });

    return message;
  }

  async findById(messageId: string) {
    return this.prisma.message.findUnique({
      where: { id: messageId }
    });
  }

  async findByChannel(
    channelId: string,
    options?: { cursor?: string; limit?: number }
  ) {
    const limit = options?.limit ?? 50;

    if (options?.cursor) {
      return this.prisma.message.findMany({
        where: { channelId },
        take: limit,
        skip: 1,
        cursor: { id: options.cursor },
        orderBy: { createdAt: 'desc' }
      });
    }

    return this.prisma.message.findMany({
      where: { channelId },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateMetadata(messageId: string, metadata: string) {
    return this.prisma.message.update({
      where: { id: messageId },
      data: { metadata }
    });
  }
}
