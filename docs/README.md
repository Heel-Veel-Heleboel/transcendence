# Counter-Pong (Transcendence)
## Overview

This project creates a Transcendence web app, following the V18 version of the subject. The project is focused on creating a web platform for playing table tennis online. The app supports a robust community management, allowing users to communicate via chat, add friends, block users, create tournament among others. 

## Architecture

The application uses a microservices architecture, dividing the program into loosely coupled services each responsible for a specific feature.

The app is encapsulated with NGINX which serves as a proxy for the whole ecosystem, enforcing HTTPS/WSS requests and enabling remote play on LAN networks.

Each service lives in a separate Docker container, making each service an independent program that can run on its own. To manage such infrastructure we introduced the observability stack.

Stack: TypeScript, React, Tailwind, SQLite

```
              ┌────────────────────────────────────────────────────────┐
              │                   Browser / LAN Client                 │
              └──────────────────┬─────────────────────────────────────┘
                                 │ HTTPS / WSS
              ┌──────────────────▼─────────────────────────────────────┐
              │                       NGINX                             │
              │              (TLS termination, reverse proxy)           │
              └──────────────────┬─────────────────────────────────────┘
                                 │ serves SPA
              ┌──────────────────▼─────────────────────────────────────┐
              │                    Frontend                             │
              │                 (React / Vite)                          │
              └────────────────┬───────────────────┬────────────────────┘
                   REST /api/* │                   │ WebSocket (Colyseus)
              ┌────────────────▼──────┐   ┌────────▼───────────────────┐
              │      API Gateway      │   │       Game Server          │
              │         :3000         │   │          :2567             │
              └──┬──────┬──────┬──────┘   │      (Colyseus WS)        │
                 │      │      │      │   └────────────────────────────┘
              ┌──▼─┐ ┌──▼──┐ ┌─▼──┐ ┌▼────────────┐
              │Auth│ │User │ │Chat│ │ Matchmaking  │
              │3003│ │Mgmt │ │3006│ │    :3005     │
              │    │ │3004 │ │    │ │              │
              └────┘ └─────┘ └────┘ └─────────────┘

              ┌────────────────────────────────────────────────────────┐
              │               Observability Stack (ELK)                │
              │   Logstash :5044 → Elasticsearch :9200 → Kibana :5601  │
              └────────────────────────────────────────────────────────┘
```

### Frontend

React + Vite SPA served on port 5173, styled with Tailwind CSS. All HTTP traffic goes through NGINX to the API Gateway via Axios, which handles JWT attachment and silent token refresh on 401 responses.

**Key libraries:** Babylon.js + Havok Physics (3D game rendering), Colyseus SDK (game room WebSocket), React Router v6, React Context API (auth, chat, match, room state), p5.js (music player).

**Routes:**

| Path | Description |
|------|-------------|
| `/` | Landing / start menu |
| `/entry/register` · `/entry/login` · `/entry/two-factor` | Auth flows including 2FA |
| `/home` | Main dashboard (protected) |
| `/profile/me` | Own profile & stats |
| `/profile/me/relationships` | Friends, pending requests, blocked users |
| `/profile/:userId` | Public profile view |
| `/game/:gameMode/:matchId/:roomId` | Live game session |
| `/tournament` · `/tournament/create` · `/tournament/:id` | Tournament lobby & management |

**Real-time connections:**
- **Game** — Colyseus WebSocket rooms on port 2567; supports reconnection via session tokens.
- **Notifications** — lightweight WebSocket (`/ws`) for real-time alerts.

### API Gateway

Central entry point on port 3000, built with Fastify. Every request passes through a global JWT middleware that decodes the token and populates `request.user`; no downstream service needs to parse JWTs itself. Protected routes add an auth guard that rejects unauthenticated requests before the proxy fires. Authenticated user context (`x-user-id`, `x-user-name`) is forwarded as headers to downstream services.

**Request pipeline (in order):**
1. Helmet security headers + CORS
2. JWT decode (global — populates `request.user` if a valid Bearer token is present)
3. Rate limiting — per-IP for anonymous requests, per-user-ID for authenticated ones; per-endpoint overrides supported
4. Auth guard (protected routes only — rejects if no valid user)
5. `@fastify/http-proxy` forwards to the upstream service

**Service routing** is driven by a JSON config (`SERVICES_FILE` env var or `SERVICES` env var). Each entry declares the upstream URL, path prefix, optional auth requirement, and WebSocket support. Prefixes are derived from the service name if not explicitly set (`/api/<name>`).

**Health checks** — `/health` returns gateway liveness; `/health/detailed` polls every upstream service's `/health` endpoint with a 3 s timeout and exponential backoff, and reports a `degraded` status if any service is unhealthy. The gateway also runs background health checks every 30 s after startup.

**Error responses** are normalised to a consistent JSON shape. In production, 5xx messages are sanitised to avoid leaking internal details; 401/403/400/422 messages are scrubbed of JWT, role, or DB schema keywords.

### Authentication Service

Handles identity on port 3003. Owns credential storage and token lifecycle — no other service issues or validates JWTs.

**Supported flows:**
- Local registration and login (bcrypt password hashing)
- TOTP-based 2FA (setup via QR code, verified on each login)
- Password change and account deletion

**Token strategy:**
- **Access tokens** — RS256-signed JWTs (`iss: AuthService`, `aud: TranscendenceApp`). Payload carries `sub`, `user_email`, `user_name`. The gateway verifies these with the public key; the auth service never needs to be hit for per-request auth.
- **Refresh tokens** — opaque `{UUIDv4}.{128-hex}` strings, stored SHA-256 hashed in the DB, rotated on every use, transported as `HttpOnly SameSite=strict` cookies. Timing-safe comparison on validation.

**Database (SQLite via Prisma):** three tables — `UserCredentials` (hashed password), `RefreshToken` (hashed token, expiry, revocation timestamp), `TwoFactorAuth` (TOTP secret, enabled flag, attempt counter, 5-minute setup window).

### User Management

Owns all user-facing data on port 3004: identities, profiles, avatars, and social graph. Built with Fastify + Prisma on SQLite, following a controller → service → repository pattern.

**What it stores:**
- **User** — name (unique), email (unique), activity status (`ONLINE`/`OFFLINE`)
- **Profile** — wins, losses, avatar path (1-to-1 with User, cascade-deleted)
- **Friendship** — directional relationship with status (`PENDING`, `ACCEPTED`, `REJECTED`, `BLOCKED`); unique constraint on the requester/addressee pair

**Key capabilities:** user lookup by ID, email, or name; avatar upload (multipart); win/loss stat updates; full friendship lifecycle including block/unblock.

**Outbound calls:** pushes friendship change events to the gateway's internal WebSocket endpoint (`POST /internal/ws/notify`) so connected clients receive real-time social updates without polling.

### Chat

REST service on port 3006 that handles messaging, channels, and social graph enforcement. It has no WebSocket server of its own — real-time delivery is delegated to the gateway's internal notify endpoint, which broadcasts to connected clients. Messages are persisted in SQLite, so clients that were offline can catch up via cursor-based pagination.

**Channel types:** `DM` (two users), `GROUP` (creator-managed membership), `TOURNAMENT` (created by matchmaking for each bracket). Note: GROUP and TOURNAMENT channels are backend-complete but not yet supported in the frontend.

**Block enforcement** is handled at the chat layer, not delegated. On every DM creation and message send the service calls user-management to check the block relationship in both directions. If either party has blocked the other the action is rejected. If user-management is unreachable, the call fails safe (treated as blocked). Blocked users' messages are also filtered out of message list responses.

**Match acknowledgement flow:** matchmaking posts a match-ack message into the relevant DM/tournament channel. Players respond via `POST /chat/match-ack/:messageId/respond`; chat forwards the answer to matchmaking, which triggers room creation when both players confirm.

**Outbound calls:** user-management (username lookup, block checks), matchmaking (forward ack/decline), gateway (WebSocket notify).

### Matchmaking

Orchestrates all match and tournament lifecycle on port 3005. It is the only service that calls the game server to provision rooms.

**Casual matchmaking:** per-game-mode in-memory FIFO queues (`classic` / `powerup`). After a player joins, pairing fires asynchronously — the two oldest players are taken off the queue and a match is created in `PENDING_ACKNOWLEDGEMENT` state. Stale entries (>30 min) are cleaned up automatically.

**Match state machine:**
```
PENDING_ACKNOWLEDGEMENT → (both ack) → SCHEDULED
  → (room created on game server) → IN_PROGRESS
  → (result reported by game server) → COMPLETED | CANCELLED
```
Declining a casual match cancels it. Declining a tournament match records a 7-0 forfeit.

**Tournament flow:** single-elimination bracket with random Fisher-Yates seeding. Non-power-of-2 player counts are handled with byes for the top seeds. Bracket is stored as a level-order binary tree array (index 0 = final). Registration, start, and per-match ack deadlines are driven by `TournamentLifecycleManager` timers. Round N+1 matches are created only after all round N matches are complete.

**Game server interaction:** when both players acknowledge a match, matchmaking calls `POST /api/rooms/create` on the game server and stores the returned Colyseus `roomId`. The game server later calls `POST /matchmaking/match/:matchId/result` with the winner and scores.

**Database (SQLite via Prisma):** `Match` (UUID PK, status, deadlines, scores, `resultSource` audit field, bracket position), `Tournament` (phase, config, timing), `TournamentParticipant` (seed, `eliminatedIn` round, final rank).

**Outbound calls:** game server (room creation), chat (match-ack messages and tournament channels), gateway (WebSocket notify), user-management (match result reporting).

### Game Server

Server-authoritative game engine on port 2567, built on Colyseus (WebSocket room management) and Babylon.js + Havok Physics running headlessly on the server. Rooms are created on-demand by the matchmaking service via `POST /api/rooms/create`.

**Game modes** (single room type `game_room`):
- **Classic** — first to 11 goals wins; scored via physics collision with goal zones
- **Powerup** — last player standing; paddles have health (lifespan) that depletes on hits; mana regenerates each frame and is spent on powerups (e.g. 30 s immunity)

**State sync:** Colyseus replicates a minimal schema to clients — player positions/dimensions/scores and active balls (`Hack` objects with position + linear velocity). Non-replicated fields (`isDead`, `isImmun`) stay server-only.

**Match lifecycle:**
- 10-second join window — game is cancelled if both players don't connect and ACK
- 5-second reconnection window on disconnect — render loop pauses, resumes on reconnect
- Results reported to **matchmaking** (not user-management): normal end sends winner + scores; disconnect sends opponent win 5-0; server shutdown sends a cancelled result with no winner

## Modules chosen

8 major modules and 3 minor modules (2 minor = 1 major equivalent, minimum required is 7 major).

**Major modules**
- **Backend framework** — Fastify + Node.js across all services
- **Standard user management & authentication** — registration, login, profiles, avatars, friends, stats, match history
- **Remote players** — two players on separate machines via Colyseus WebSocket rooms; handles disconnect and reconnection
- **Live chat** — direct messaging, block enforcement, match invites via ack messages, tournament notifications
- **Two-Factor Authentication & JWT** — TOTP 2FA with QR code setup; RS256-signed JWTs with HttpOnly refresh token rotation
- **Log management infrastructure (ELK)** — Logstash, Elasticsearch, Kibana; per-service daily indices, TLS-secured internal traffic
- **Microservices architecture** — six independent backend services (auth, user-management, chat, matchmaking, game-server, api-gateway), each with its own database
- **Advanced 3D graphics** — Babylon.js + Havok Physics for the Pong game

**Minor modules**
- **Frontend toolkit** — React + Tailwind CSS
- **Backend database** — SQLite via Prisma across all data-holding services
- **Game customization** — powerup mode (health, mana, powershots) alongside the default classic mode

## Observability

The observability stack ships alongside the app as a separate Compose overlay. Structured JSON logs from every service are shipped via `pino-socket` to Logstash, which enriches them and writes them to per-service daily indices in Elasticsearch. Kibana is the primary interface for searching and filtering logs.

See [OBSERVABILITY_GUIDE.md](OBSERVABILITY_GUIDE.md) for setup, credentials, Kibana data view creation, and troubleshooting.

## Docker

All services are defined in `docker-compose.yml` with a separate `docker-compose.observability.yml` overlay for the observability stack. Shared inter-service URLs are declared once in `docker/shared.env` and loaded by every service. SQLite databases are persisted in named volumes so data survives restarts. On service startup, schema changes are applied with `prisma migrate deploy`. Use `prisma db push` only for development-oriented workflows when you explicitly want to sync schema changes without running migrations.

See [DOCKER.md](DOCKER.md) for the full service table, build instructions, volume management, and the migration upgrade guide.

## Security Considerations

Security is applied in layers, from the network edge down to individual service logic.

### Transport

NGINX terminates TLS for all external traffic, enforcing TLSv1.2/1.3 only with weak ciphers excluded (`HIGH:!aNULL:!MD5`). All browser-to-server communication is HTTPS/WSS. Internal service-to-service traffic runs over plain HTTP within the isolated Docker network.

### Authentication & Tokens

- **Asymmetric JWT signing (RS256):** the auth service signs tokens with a private key; every other service verifies with the public key only. The private key never leaves the auth service.
- **Refresh token hardening:** tokens are opaque `{UUIDv4}.{128-hex}` strings, stored SHA-256 hashed in the database, rotated on every use, and compared with timing-safe equality to prevent timing attacks. Transported as `HttpOnly SameSite=strict` cookies.
- **Password storage:** bcrypt with configurable cost factor.
- **TOTP 2FA:** time-based one-time passwords via `otplib`; setup secrets expire after 5 minutes and attempt counts are tracked.

### Gateway-Level Controls

All requests pass through the API Gateway before reaching any service:

- **Security headers:** `@fastify/helmet` sets CSP, HSTS (1-year max-age, `includeSubDomains`, `preload`), X-Frame-Options, and related headers on every response.
- **CORS:** explicit origin allowlist via `ALLOWED_ORIGINS`; `credentials: true` is never combined with a wildcard origin.
- **Rate limiting:** in-memory sliding window, keyed by IP for anonymous requests and by user ID for authenticated ones; per-endpoint overrides are supported via config.
- **Body size limit:** 1 MB default (`BODY_LIMIT_BYTES`), enforced before proxying.
- **Single JWT parse point:** the gateway decodes the JWT once and forwards trusted `x-user-id`/`x-user-name` headers downstream; no service duplicates token validation logic.

### Error Sanitization

In production, error responses are scrubbed before reaching the client:

| Status | Sanitization |
|--------|-------------|
| 5xx | Message replaced with `"Internal Server Error"` |
| 401 | Messages containing `jwt`, `token`, `bearer`, `session` keywords replaced with `"Authentication required"` |
| 403 | Messages containing role/scope implementation details replaced with `"Access denied"` |
| 400 / 422 | Messages containing DB schema keywords (`table`, `column`, `sql`, `constraint`, etc.) replaced with `"Invalid request"` |

### Social Graph & Block Enforcement

The chat service enforces block relationships at the application layer independently of the frontend:

- Block status is checked in **both directions** on every DM creation and every message send.
- If the user-management service is unreachable, the check **fails closed** (the action is rejected rather than permitted).
- Blocked users' messages are filtered out of paginated message list responses.

### Input Validation & Injection Prevention

- All database access uses **Prisma ORM with parameterized queries** — no raw SQL is constructed from user input in any service.
- Request bodies are validated with **Zod** or **TypeBox** schemas at each service boundary before touching the database.
- Avatar uploads enforce a **MIME type check** (`image/*` only) server-side; NGINX enforces a 10 MB outer bound on request body size.

### Game Integrity

The game server is **fully server-authoritative**: all physics and scoring run on the server (Babylon.js + Havok headless). Clients send only input; the server never trusts client-reported scores or positions. Match results are reported directly from the game server to matchmaking — the frontend has no write path to match outcomes.


