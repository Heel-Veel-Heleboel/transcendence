# Transcendence — Project Overview

## Running the project

### Local development (single machine)

```sh
make dev-build
```

Open `http://localhost:5173` in your browser.

---

### Remote play / evaluation (two separate machines on the same LAN)

The frontend URLs are baked into the bundle at Docker build time via Vite's `VITE_*` env vars.
For two players on separate machines you need to build the frontend pointing at the host machine's
LAN IP, and serve everything over HTTPS.

`make remote` handles all of this in one step:

```sh
make remote
# or, if auto-detection fails:
make remote HOST_IP=10.x.x.x
```

What it does:
1. Detects (or uses the provided) LAN IP.
2. Runs `scripts/gen-cert.sh` to generate a self-signed TLS certificate with that IP as a Subject Alternative Name, stored in `certs/`.
3. Builds the frontend Docker image with `VITE_API_URL=https://<ip>` and `VITE_GAME_URL=https://<ip>/colyseus` baked in.
4. Starts the full stack (nginx + all services).

Both players open `https://<host-ip>` in their browsers.
Browsers will show a security warning for the self-signed cert — click **Advanced → Proceed**
(or type `thisisunsafe` in Chrome with the page focused).

To stop:

```sh
make remote-down
```

#### How the URLs work

| Env var | Default (local dev) | Remote play |
|---------|---------------------|-------------|
| `VITE_API_URL` | `http://localhost:3000` | `https://<host-ip>` |
| `VITE_GAME_URL` | `http://localhost:2567` | `https://<host-ip>/colyseus` |

`VITE_API_URL` drives all REST calls and the notification WebSocket (`wss://` is derived from it automatically).
`VITE_GAME_URL` drives the Colyseus game-room connection.

Both variables are declared in [`src/frontend/src/vite-env.d.ts`](src/frontend/src/vite-env.d.ts) and
consumed in [`src/frontend/src/shared/config/AppConfig.ts`](src/frontend/src/shared/config/AppConfig.ts)
and [`src/frontend/src/components/providers/Room.tsx`](src/frontend/src/components/providers/Room.tsx).

#### TLS / nginx

nginx terminates TLS on port 443 and proxies:
- `/colyseus/*` → game-server:2567 (Colyseus WebSocket)
- everything else → api-gateway:3000 (REST + notification WebSocket)

Internal service-to-service traffic stays on plain HTTP inside the Docker bridge network.
Only the nginx container needs the certificate.

---

### Production (app + full observability stack)

```sh
make prod-build HOST_IP=<ip>
```

Observability stack only (ELK + Prometheus + Grafana):

```sh
make obs
```

---

## Makefile targets

| Target | Description |
|--------|-------------|
| `make` / `make all` | Build and start the app stack |
| `make cert` | Generate TLS cert for `HOST_IP` (auto-detected or explicit) |
| `make remote` | Cert + build + start for LAN remote play |
| `make remote-down` | Stop the remote stack |
| `make dev` | Start dev stack with file watching |
| `make dev-build` | Build and start dev stack |
| `make prod-build` | Build and start app + observability |
| `make obs` | Start observability stack only |
| `make logs` | Tail all service logs |
| `make ps` | Show running containers |
| `make clean` | Stop and remove volumes |
| `make fclean` | Full Docker purge |

---

## Further reading

- [Docker setup and volumes](docs/DOCKER.md)
- [API gateway routing](docs/API-GATEWAY.md)
- [Matchmaking architecture](docs/MATCHMAKING_ARCHITECTURE.md)
- [Observability guide](docs/OBSERVABILITY_GUIDE.md)
- [Requirements audit](docs/REQUIREMENTS_AUDIT.md)
- [Finalization plan](docs/FINALIZATION_PLAN.md)
