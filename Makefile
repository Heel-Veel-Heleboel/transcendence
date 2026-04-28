NAME	:= .docker_compose_started

COMPOSE_DEV  = docker compose -f docker-compose-dev.yml -f docker-compose.observability.yml
COMPOSE_PROD = docker compose -f docker-compose.yml -f docker-compose.observability.yml

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
	$(COMPOSE_PROD) down -v
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

# ── Prod / remote play / evaluation ──────────────────────────────────────────
# Full stack: app + observability (ELK + Prometheus + Grafana) + HTTPS.
# Generates a self-signed cert for the machine's hostname, then starts everything.
# No admin rights or /etc/hosts changes needed — hostname resolves via LAN DNS.
#
# Usage:
#   make prod                # auto-detects hostname via $(hostname)
#   make prod HOSTNAME=my-machine
#
# Host machine opens:   https://$(HOSTNAME):$(NGINX_PORT)
# Remote player opens:  https://$(HOSTNAME):$(NGINX_PORT)  (no setup needed)

prod: cert
	$(HTTPS_ARGS) $(COMPOSE_PROD) up -d --build
	touch $(NAME)

prod-down:
	$(COMPOSE_PROD) down
	rm -rf $(NAME)

# ── Utilities ─────────────────────────────────────────────────────────────────

logs:
	$(COMPOSE_PROD) logs -f

ps:
	$(COMPOSE_PROD) ps

$(NAME):
	$(COMPOSE_PROD) up --build
	touch $(NAME)

.PHONY: all clean fclean re cert dev dev-build dev-down prod prod-down logs ps
