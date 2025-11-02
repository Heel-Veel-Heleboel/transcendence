import { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

// Extend FastifyRequest to include correlationId
declare module 'fastify' {
  interface FastifyRequest {
    correlationId?: string;
  }
}

// Add correlation ID to all requests for distributed tracing
export async function correlationIdMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const correlationId =
    (request.headers['x-correlation-id'] as string | undefined) || uuidv4();
  request.correlationId = correlationId;
  reply.header('x-correlation-id', correlationId);
  request.log = request.log.child({ correlationId });
}

// Log request details and response status
export async function requestLoggingMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const startTime = Date.now();

  // Log incoming request
  request.log.info(
    {
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      userId: request.user?.sub,
      ip: request.ip,
      correlationId: request.correlationId
    },
    'Incoming request'
  );

  // Hook into response completion
  reply.raw.on('finish', () => {
    const duration = Date.now() - startTime;

    request.log.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.raw.statusCode,
        duration,
        userId: request.user?.sub,
        correlationId: request.correlationId
      },
      'Request completed'
    );
  });
}
