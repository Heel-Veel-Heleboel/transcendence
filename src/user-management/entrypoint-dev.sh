#!/bin/sh

# INFO:give dev user access to data volume
chown -R app:appgroup /data

npx prisma studio --browser none --port 51212 &

# INFO:run program from script argument as dev user
exec runuser -u app "$@"
