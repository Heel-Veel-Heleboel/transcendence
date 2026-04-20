NAME	:= .docker_compose_started

COMPOSE_APP  = docker compose -f docker-compose.yml
COMPOSE_DEV  = docker compose -f docker-compose-dev.yml -f docker-compose.observability.yml
COMPOSE_PROD = docker compose -f docker-compose.yml -f docker-compose.observability.yml
COMPOSE_OBS  = docker compose -f docker-compose.observability.yml

# The machine's actual hostname — resolvable via school/LAN DNS without /etc/hosts.
# Override at the command line: make remote HOSTNAME=my-custom-host
HOSTNAME     := $(shell hostname)
NGINX_PORT   := 7140

# Shell env vars passed to docker compose for HTTPS builds.
# VITE_* are baked into the frontend bundle at build time.
# ALLOWED_ORIGINS and COOKIE_SECURE are read by services at runtime.
HTTPS_ARGS = VITE_API_URL=https://$(HOSTNAME):$(NGINX_PORT) \
             VITE_GAME_URL=https://$(HOSTNAME):$(NGINX_PORT)/colyseus \
             ALLOWED_ORIGINS=http://localhost:5173,https://$(HOSTNAME):$(NGINX_PORT) \
             COOKIE_SECURE=true

all: $(NAME)

clean:
	docker compose down -v
	rm -rf $(NAME)

fclean: clean
	docker container prune -f
	docker image prune -af
	docker volume prune -af
	docker system prune -a

re: fclean all

# ── TLS certificate ───────────────────────────────────────────────────────────
# Generates a self-signed cert for the machine's hostname (no admin rights needed).
# Remote players connect to: https://$(HOSTNAME):$(NGINX_PORT)

cert:
	@bash scripts/gen-cert.sh $(HOSTNAME)

# ── Dev (app services only, pino-pretty logs) ────────────────────────────────

dev:
	$(COMPOSE_DEV) up --watch
	touch $(NAME)

dev-build:
	$(COMPOSE_DEV) up -d --build

dev-down:
	$(COMPOSE_DEV) down

# ── Remote play / evaluation (LAN, two separate machines) ────────────────────
# Generates a cert for the machine's hostname, then starts the full stack.
# No admin rights or /etc/hosts changes needed — the hostname resolves via LAN DNS.
#
# Usage:
#   make remote              # auto-detects hostname via $(hostname)
#   make remote HOSTNAME=my-machine
#
# Host machine opens:   https://$(HOSTNAME):$(NGINX_PORT)
# Remote player opens:  https://$(HOSTNAME):$(NGINX_PORT)  (no setup needed)

remote: cert
	$(HTTPS_ARGS) $(COMPOSE_APP) up -d --build
	touch $(NAME)

remote-down:
	$(COMPOSE_APP) down
	rm -rf $(NAME)

# ── Prod (app + observability stack) ─────────────────────────────────────────

prod:
	$(COMPOSE_PROD) up -d

prod-build:
	$(HTTPS_ARGS) $(COMPOSE_PROD) up -d --build

prod-down:
	$(COMPOSE_PROD) down

# ── Observability stack only (ELK + Prometheus + Grafana) ────────────────────

obs:
	$(COMPOSE_OBS) up -d

obs-build:
	$(COMPOSE_OBS) up -d --build

obs-down:
	$(COMPOSE_OBS) down

# ── Utilities ─────────────────────────────────────────────────────────────────

logs:
	$(COMPOSE_APP) logs -f

ps:
	$(COMPOSE_APP) ps

$(NAME):
	$(COMPOSE_APP) up --build
	touch $(NAME)

.PHONY: all clean fclean re cert dev dev-build dev-down remote remote-down prod prod-build prod-down obs obs-build obs-down logs ps
