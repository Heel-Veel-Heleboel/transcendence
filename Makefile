NAME	:= .docker_compose_started

COMPOSE_APP  = docker compose -f docker-compose.yml
COMPOSE_DEV = docker compose -f docker-compose.yml -f docker-compose.observability.yml
COMPOSE_PROD = docker compose -f docker-compose.yml -f docker-compose.observability.yml

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

# ── Dev (app services only, pino-pretty logs) ────────────────────────────────

dev:
	$(COMPOSE_DEV) up --watch
	touch $(NAME)

dev-build:
	$(COMPOSE_DEV) up -d --build

dev-down:
	$(COMPOSE_DEV) down

# ── Prod (app + observability stack) ─────────────────────────────────────────

prod:
	$(COMPOSE_PROD) up -d

prod-build:
	$(COMPOSE_PROD) up -d --build

prod-down:
	$(COMPOSE_PROD) down

# ── Utilities ─────────────────────────────────────────────────────────────────

logs:
	$(COMPOSE_APP) logs -f

ps:
	$(COMPOSE_APP) ps

$(NAME):
	docker compose up --build
	touch $(NAME)

.PHONY: all clean fclean re dev dev-build dev-down prod prod-build prod-down logs ps
