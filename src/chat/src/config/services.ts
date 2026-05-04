import type { FastifyBaseLogger } from 'fastify';
import type { PrismaClient } from '../../generated/prisma/client.js';
import type { Clients } from './clients.js';
import { ChannelDao } from '../dao/channel.dao.js';
import { MessageDao } from '../dao/message.dao.js';
import { NotificationService } from '../services/notification.js';
import { BlockService } from '../services/block.js';
import { ChannelService } from '../services/channel.js';
import { MessageService } from '../services/message.js';
import { MatchAckService } from '../services/match-ack.js';

export function createServices(prisma: PrismaClient, clients: Clients, log: FastifyBaseLogger) {
  const channelDao = new ChannelDao(prisma);
  const messageDao = new MessageDao(prisma);
  const notificationService = new NotificationService(channelDao, log);
  const blockService = new BlockService(log);
  const channelService = new ChannelService(channelDao, messageDao, notificationService, blockService, log, clients.userClient);
  const messageService = new MessageService(channelDao, messageDao, notificationService, blockService, log, clients.userClient);
  const matchAckService = new MatchAckService(channelDao, messageDao, notificationService, log, clients.matchmakingClient);
  return { channelService, messageService, matchAckService };
}

export type Services = ReturnType<typeof createServices>;
