NAME	:= .docker_compose_started

COMPOSE_DEV  = docker compose -f docker-compose-dev.yml
COMPOSE_APP  = docker compose -f docker-compose.yml
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
	$(COMPOSE_OBS) down -v
	$(COMPOSE_APP) down -v
	rm -rf $(NAME)

fclean: clean
	docker container prune -f
	docker image prune -af
	docker volume prune -af
	docker system prune -af

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

# ── Prod / remote play / evaluation ──────────────────────────────────────────
# Two-step startup: app first (creates the transcendence-app network),
# then observability (joins it as external).
#
# Usage:
#   make prod                # start app services with HTTPS
#   make obs                 # start observability stack (run after prod)
#   make prod HOSTNAME=my-machine

prod: cert
	$(HTTPS_ARGS) $(COMPOSE_APP) up -d --build
	touch $(NAME)

prod-down:
	$(COMPOSE_APP) down
	rm -rf $(NAME)

# ── Observability (ELK) ───────────────────────────────────────────────────────
# Requires app to be running first (transcendence-app network must exist).

obs:
	$(COMPOSE_OBS) up -d

obs-down:
	$(COMPOSE_OBS) down

# ── Utilities ─────────────────────────────────────────────────────────────────

$(NAME):
	$(COMPOSE_APP) up --build
	touch $(NAME)

.PHONY: all clean fclean re cert dev dev-build dev-down prod prod-down obs obs-down
