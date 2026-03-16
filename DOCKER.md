# Docker Setup

## Services

| Service | Port | Description |
|---|---|---|
| api-gateway | 3002 | Entry point — proxies all requests to downstream services |
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

A `buildkitd.toml` config is included at the root of the repo. Use it to create a custom builder
that processes one image at a time:

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
> Subsequent builds are fast because Docker layer caching and the npm cache mount
> (`--mount=type=cache,target=/root/.npm`) skip unchanged layers.

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
