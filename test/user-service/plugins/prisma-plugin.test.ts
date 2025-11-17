import { describe, it, expect, afterEach } from 'vitest';
import prismaPlugin from '../../../src/user-service/src/plugins/prisma-plugin.js';
import fastify from 'fastify';
describe('Prisma plugin', () => {

  it('should decorate fastify instance with prisma client', async () => {
    const app = fastify();
    await app.register(prismaPlugin);

    expect(app.prisma).toBeDefined();
    expect(typeof app.prisma).toBe('object');
    expect(typeof app.prisma.user).toBe('object'); // Assuming 'user' is a model in your Prisma schema
  });
  afterEach(async () => {
    await fastify().close();
  });
});