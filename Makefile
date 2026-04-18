NAME	:= .docker_compose_started

COMPOSE_APP  = docker compose -f docker-compose.yml
COMPOSE_DEV  = docker compose -f docker-compose-dev.yml -f docker-compose.observability.yml
COMPOSE_PROD = docker compose -f docker-compose.yml -f docker-compose.observability.yml
COMPOSE_OBS  = docker compose -f docker-compose.observability.yml

HOSTNAME     := transcendence-avs

# Detect the machine's primary LAN IP automatically.
# Override at the command line: make remote HOST_IP=10.x.x.x
HOST_IP ?= $(shell ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($$i=="src") print $$(i+1)}' | head -1)
ifeq ($(HOST_IP),)
HOST_IP := $(shell ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo localhost)
endif

# Shell env vars passed to docker compose for HTTPS builds.
# VITE_* are baked into the frontend bundle at build time.
# HOST_IP and COOKIE_SECURE are substituted into docker-compose.yml at runtime.
HTTPS_ARGS = VITE_API_URL=https://$(HOSTNAME) VITE_GAME_URL=https://$(HOSTNAME)/colyseus HOST_IP=$(HOST_IP) COOKIE_SECURE=true

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

cert:
	@bash scripts/gen-cert.sh $(HOST_IP)

# ── /etc/hosts entry (run once per machine) ───────────────────────────────────
# Host machine:   make hosts          → maps 127.0.0.1 to $(HOSTNAME)
# Remote player:  make hosts HOST_IP=<host-machine-ip>

hosts:
	@grep -q "$(HOSTNAME)" /etc/hosts && \
		echo "$(HOSTNAME) already in /etc/hosts" || \
		echo "$(HOST_IP)	$(HOSTNAME)" | sudo tee -a /etc/hosts

# ── Dev (app services only, pino-pretty logs) ────────────────────────────────

dev:
	$(COMPOSE_DEV) up --watch
	touch $(NAME)

dev-build:
	$(COMPOSE_DEV) up -d --build

dev-down:
	$(COMPOSE_DEV) down

# ── Remote play / evaluation (LAN, two separate machines) ────────────────────
# Generates a cert, adds /etc/hosts entry, builds the frontend with the correct
# URLs baked in, then starts the full stack.
#
# Usage:
#   make remote              # auto-detects LAN IP
#   make remote HOST_IP=10.x.x.x   # or pass it explicitly
#
# Host machine opens:   https://$(HOSTNAME)
# Remote player runs:   make hosts HOST_IP=<host-ip>  then opens the same URL.

remote: cert hosts
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

.PHONY: all clean fclean re cert hosts dev dev-build dev-down remote remote-down prod prod-build prod-down obs obs-build obs-down logs ps
