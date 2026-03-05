import { PrismaClient, type MessageType } from '../../generated/prisma/client.js';

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

  async countUnread(channelId: string, since: Date | null): Promise<number> {
    if (!since) {
      return this.prisma.message.count({ where: { channelId } });
    }
    return this.prisma.message.count({
      where: { channelId, createdAt: { gt: since } }
    });
  }

  async countUnreadBatch(
    channels: { id: string; lastReadAt: Date | null }[]
  ): Promise<Map<string, number>> {
    if (channels.length === 0) return new Map();

    const neverRead = channels.filter(c => !c.lastReadAt);
    const hasRead = channels.filter(c => c.lastReadAt);

    const results = new Map<string, number>();

    // Channels never read: count all messages in one groupBy query
    if (neverRead.length > 0) {
      const counts = await this.prisma.message.groupBy({
        by: ['channelId'],
        where: { channelId: { in: neverRead.map(c => c.id) } },
        _count: { id: true }
      });
      for (const row of counts) {
        results.set(row.channelId, row._count.id);
      }
      for (const c of neverRead) {
        if (!results.has(c.id)) results.set(c.id, 0);
      }
    }

    // Channels with lastReadAt: each has a different threshold, run counts in parallel
    if (hasRead.length > 0) {
      const counts = await Promise.all(
        hasRead.map(c =>
          this.prisma.message.count({
            where: { channelId: c.id, createdAt: { gt: c.lastReadAt! } }
          }).then(count => ({ id: c.id, count }))
        )
      );
      for (const { id, count } of counts) {
        results.set(id, count);
      }
    }

    return results;
  }

}
