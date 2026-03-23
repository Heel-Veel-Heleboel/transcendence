NAME	:= .docker_compose_started

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

dev:
	docker compose -f docker-compose-dev.yml up --watch 
	touch $(NAME)

$(NAME):
	docker compose up --build 
	touch $(NAME)
