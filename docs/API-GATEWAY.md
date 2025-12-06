# API Gateway

The API Gateway is the single entry point for all client requests to the Transcendence microservices architecture.

## Architecture

```
Browser (SPA)
     │
     ▼
API Gateway :3000
     ├─→ Auth Service :9001
     ├─→ User Service :9002
     └─→ Game Service :9003
```

## Features

- **Request Routing** - Proxies requests to microservices with configurable prefixes
- **Authentication** - JWT validation and user context forwarding
- **CORS** - Cross-origin request handling (see [CORS.md](./CORS.md))
- **Rate Limiting** - Global and per-endpoint limits
- **Logging** - Structured logging with correlation IDs
- **Error Handling** - Centralized error responses

## Quick Start

### Development
```bash
cd src/api-gateway
npm install
npm run dev  # Runs on http://localhost:3000
```

### Production
```bash
npm run build
npm start
```

## Configuration

### Environment Variables

```bash
# Required in production
JWT_SECRET=your-secret-key

# Optional
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3000

# Service configuration (JSON array or file path)
SERVICES='[{"name":"auth-service","upstream":"http://localhost:9001",...}]'
# OR
SERVICES_FILE=./config/services.json
```

### Service Configuration

Services are configured via `SERVICES` env var or `SERVICES_FILE`:

```json
[
  {
    "name": "auth-service",
    "upstream": "http://auth-service:9001",
    "prefix": "/api/auth",
    "requiresAuth": false
  },
  {
    "name": "user-service",
    "upstream": "http://user-service:9002",
    "prefix": "/api/users",
    "requiresAuth": true,
    "timeout": 5000
  }
]
```

**Fields:**
- `name` (required) - Service identifier
- `upstream` (required) - Service URL
- `prefix` - Gateway route prefix (default: `/api/{name}`)
- `rewritePrefix` - Upstream path (default: derived from prefix)
- `requiresAuth` - Require JWT (default: `false`)
- `timeout` - Request timeout in ms (default: `5000`)
- `retries` - Retry attempts (default: `2`)
- `websocket` - Enable WebSocket (default: `false`)

## API Routes

### Health Check
```http
GET /health
```
Returns gateway and upstream service health.

### Proxied Routes
Routes matching service prefixes are proxied to upstream services:

```
GET /api/users/profile
→ http://user-service:9002/users/profile
```

## Authentication

Clients send JWT in Authorization header:
```
Authorization: Bearer <token>
```

Gateway validates JWT and forwards user context to services:
```
X-User-Id: 123
X-User-Email: user@example.com
X-User-Role: user
```

## Error Responses

All errors return consistent JSON:
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "correlationId": "abc-123",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

Production mode (`NODE_ENV=production`) sanitizes internal 500 errors.

## Monitoring

### Logging
Structured JSON logs with Pino:
```json
{
  "level": "info",
  "correlationId": "abc-123",
  "method": "GET",
  "url": "/api/users/profile",
  "statusCode": 200,
  "duration": 45,
  "msg": "Request completed"
}
```

### Health Monitoring
Monitor `/health` endpoint for gateway and service availability.

## Development

### Project Structure
```
src/api-gateway/
├── src/
│   ├── index.ts              # Server setup
│   ├── config/               # Configuration
│   ├── middleware/           # Auth, logging, rate limiting
│   ├── routes/               # Proxy, health, error handling
│   └── utils/                # Helpers
└── test/                     # Tests
```

### Running Tests
```bash
npm test
npm test -- test/api-gateway/cors.test.ts  # Specific test
```

### Adding a Service
Add to configuration and restart:
```json
{
  "name": "new-service",
  "upstream": "http://new-service:9004",
  "prefix": "/api/new",
  "requiresAuth": true
}
```

## Troubleshooting

**Gateway won't start**
- Check `JWT_SECRET` is set in production
- Verify port 3000 is available
- Validate service configuration JSON

**CORS errors**
- Add frontend origin to `ALLOWED_ORIGINS`
- See [CORS.md](./CORS.md) for details

**Authentication failures**
- Verify JWT token is valid
- Check `JWT_SECRET` matches auth service
- Format: `Authorization: Bearer <token>`

**504 Gateway Timeout**
- Check upstream service is running
- Increase service `timeout` if needed
- Review service logs

## References

- [CORS Configuration](./CORS.md)
- [Fastify Documentation](https://www.fastify.io/)
