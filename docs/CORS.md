# CORS Configuration

This document describes the Cross-Origin Resource Sharing (CORS) configuration for the API Gateway.

## Overview

CORS is enabled to allow the Single Page Application (SPA) frontend to make requests to the API Gateway from different origins (ports or domains). This is essential for development and production deployments.

## Configuration

CORS is configured using the `@fastify/cors` plugin in the API Gateway server setup.

### Default Configuration

By default, the following origins are allowed:
- `http://localhost:8080` - Frontend development server
- `http://localhost:3000` - Alternative development port

### Environment Variables

You can customize allowed origins using the `ALLOWED_ORIGINS` environment variable:

```bash
# Single origin
ALLOWED_ORIGINS=http://localhost:8080

# Multiple origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3000,https://myapp.com
```

### CORS Settings

The following CORS settings are configured:

| Setting | Value | Description |
|---------|-------|-------------|
| **origin** | Configurable via `ALLOWED_ORIGINS` | List of allowed origins |
| **credentials** | `true` | Allows cookies and Authorization headers |
| **methods** | `GET, POST, PUT, DELETE, PATCH, OPTIONS` | Allowed HTTP methods |
| **allowedHeaders** | `Content-Type, Authorization, X-Correlation-Id` | Headers that clients can send |
| **exposedHeaders** | `X-Correlation-Id` | Headers that clients can read from responses |

## Usage

### Development

In development, the default configuration allows requests from common development ports:

```typescript
// Frontend running on http://localhost:8080 can make requests to API Gateway
fetch('http://localhost:3000/api/users', {
  credentials: 'include', // Include cookies
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  }
});
```

### Production

For production deployments, set the `ALLOWED_ORIGINS` environment variable:

```bash
# Docker Compose
ALLOWED_ORIGINS=https://myapp.com,https://www.myapp.com

# Kubernetes ConfigMap
ALLOWED_ORIGINS: "https://myapp.com"
```

### Same-Origin Deployment

If your frontend and API Gateway are served from the same origin (e.g., both on `https://myapp.com`), CORS is not needed but still safe to enable.

## Security Considerations

### Credentials

The `credentials: true` setting allows:
- Cookies (including httpOnly cookies for authentication)
- Authorization headers
- Client certificates

**Important:** Only use this with trusted origins. Never allow `origin: '*'` with `credentials: true`.

### Allowed Origins

- **Development:** Multiple localhost origins are safe
- **Production:** Only allow your actual frontend domains
- **Never use `*` wildcard** in production with credentials enabled

### Headers

**Allowed Headers:**
- `Content-Type` - For JSON/form data
- `Authorization` - For Bearer tokens
- `X-Correlation-Id` - For distributed tracing

**Exposed Headers:**
- `X-Correlation-Id` - Allows frontend to read correlation IDs for debugging

Only add headers that are actually needed by your application.

## Testing

CORS configuration is tested in `test/api-gateway/cors.test.ts`:

```bash
# Run CORS tests
npm test -- test/api-gateway/cors.test.ts
```

Tests verify:
- CORS headers are present in responses
- OPTIONS preflight requests work correctly
- All configured methods are allowed
- Custom headers (Authorization, X-Correlation-Id) are supported
- Exposed headers are accessible to clients

## Troubleshooting

### CORS Error: "No 'Access-Control-Allow-Origin' header"

**Cause:** Frontend origin is not in the allowed list.

**Solution:** Add your frontend URL to `ALLOWED_ORIGINS`:
```bash
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173
```

### CORS Error: "Credentials flag is true, but Access-Control-Allow-Credentials is not"

**Cause:** Server doesn't support credentials, but client is sending them.

**Solution:** This should not happen with our configuration (`credentials: true`). Check if CORS plugin is properly registered.

### Preflight Request Fails (405 Method Not Allowed)

**Cause:** Server doesn't handle OPTIONS requests.

**Solution:** This should not happen with Fastify's CORS plugin. Verify the plugin is registered before routes.

## Examples

### Frontend Fetch with CORS

```typescript
// Fetch with credentials (cookies)
const response = await fetch('http://localhost:3000/api/users', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Fetch with Authorization header
const response = await fetch('http://localhost:3000/api/users', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ name: 'John' })
});

// Read exposed correlation ID
const correlationId = response.headers.get('X-Correlation-Id');
```

### Axios Configuration

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true, // Include cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to add auth token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## References

- [@fastify/cors Documentation](https://github.com/fastify/fastify-cors)
- [MDN CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [CORS Specification](https://fetch.spec.whatwg.org/#http-cors-protocol)
