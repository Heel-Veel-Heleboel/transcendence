import { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

// Add correlation ID to all requests for distributed tracing
export async function correlationIdMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const correlationId =
    (request.headers['x-correlation-id'] as string) || uuidv4();

  // Add to request for use in other middleware
  (request as any).correlationId = correlationId;

  // Add to response headers
  reply.header('x-correlation-id', correlationId);

  // Add to log context
  request.log = request.log.child({ correlationId });
}

// Log all requests and responses
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
      ip: request.ip
    },
    'Incoming request'
  );

  // Hook into response to log completion
  reply.raw.on('finish', () => {
    const duration = Date.now() - startTime;

    request.log.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.raw.statusCode,
        duration,
        userId: request.user?.sub
      },
      'Request completed'
    );
  });
}
