NAME	:= .docker_compose_started

all: $(NAME)

clean:
	docker compose down
	rm -rf $(NAME)

fclean: clean
	docker container prune -f
	docker image prune -af
	docker volume prune -af
	docker system prune -a

re: fclean all

dev:
	docker compose up --watch frontend-dev
	touch $(NAME)

$(NAME):
	docker compose up --detach frontend
	touch $(NAME)
