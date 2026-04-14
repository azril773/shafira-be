# # stop all running containers
docker stop $(docker ps -aq)
# # remove all stopped containers
docker rm $(docker ps -aq)
# remove all docker images except 'dpage/pgadmin4' and 'postgres'
docker image ls --format '{{.ID}} {{.Repository}}:{{.Tag}}' | awk '$2 !~ /^(postgres|dpage\/pgadmin4)(:|$)/ {print $1}' | xargs -r docker rmi -f

# remove all stray volumes if any
docker volume rm $(docker volume ls -q)
