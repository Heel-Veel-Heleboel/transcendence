# Docker Setup

## Services

| Service | Port | Description |
|---|---|---|
| api-gateway | 3000 | Entry point — proxies all requests to downstream services |
| frontend | 5173 | Vite frontend |
| auth | 3003 | Authentication, JWT issuance |
| user-management | 3004 | User profiles and stats |
| matchmaking | 3005 | Casual and tournament matchmaking |
| chat | 3006 | Real-time messaging |
| game-server | 2567 | Colyseus game server |

## Quick Start

```sh
docker compose up --build
```

## On Bad Network / npm install Failures

When building in parallel, all services run `npm install` at the same time. This can cause
`ECONNRESET` or timeout errors on slow or unstable connections because multiple large dependency
trees are downloaded simultaneously.

### Fix: limit BuildKit parallelism to 1

Create a `buildkitd.toml` config at the root of the repo with contents similar to:

```toml
[worker.oci]
max-parallelism = 1
```

Then use it to create a custom builder that processes one image at a time:

```sh
# One-time setup
docker buildx create --use \
  --name transcendence-builder \
  --driver docker-container \
  --config buildkitd.toml

# Then build and start as normal, passing the builder via env var
BUILDX_BUILDER=transcendence-builder docker compose up --build
```

To go back to the default builder:

```sh
docker buildx use default
```

> **Note:** The first build will take longer because packages are downloaded sequentially.
> Subsequent builds are faster because Docker layer caching and npm's cached dependencies
> allow unchanged layers to be reused instead of reinstalling everything from scratch.

## Shared Service Environmental Vars

Shared Env Var (e.g. Inter-service URLs (Docker internal hostnames)) are defined once in [`docker/shared.env`](docker/shread.env)
and loaded by every service via `env_file`. To change a service's address — e.g. when deploying
to a different host — edit that file instead of hunting through the compose file.

```env
AUTH_SERVICE_URL=http://auth:3003
USER_MANAGEMENT_URL=http://user-management:3004
CHAT_SERVICE_URL=http://chat:3006
MATCHMAKING_URL=http://matchmaking:3005
GAME_SERVER_URL=http://game-server:2567
API_GATEWAY_URL=http://api-gateway:3000
GATEWAY_URL=http://api-gateway:3000

NODE_ENV=production
```

App-specific config (CORS origins, JWT key paths, log levels, etc.) belongs in each
service's own `.env` file — not in the compose file or `urls.env`.

## Volumes

SQLite databases are persisted in named Docker volumes so data survives container restarts:

| Volume | Service |
|---|---|
| `auth-data` | auth |
| `user-management-data` | user-management |
| `matchmaking-data` | matchmaking |
| `chat-data` | chat |

To wipe all data and start fresh:

```sh
docker compose down -v
```

## Database Migrations

| Service | Strategy | Notes |
|---|---|---|
| auth | `prisma migrate deploy` | Has versioned migrations in `prisma/migrations/` |
| chat | `prisma db push` | No migrations yet — schema is pushed directly |
| matchmaking | `prisma db push` | No migrations yet — schema is pushed directly |
| user-management | `prisma db push` | No migrations yet — schema is pushed directly |

Before going to production, generate migrations for the remaining services:

```sh
cd src/<service>
npx prisma migrate dev --name init
```

Commit the generated `prisma/migrations/` folder, then switch the service's Dockerfile CMD
to use `prisma migrate deploy` instead of `prisma db push`.
