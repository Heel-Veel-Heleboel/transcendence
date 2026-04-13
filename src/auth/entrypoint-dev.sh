#!/bin/sh

# INFO:give dev user access to data volume
chown -R app:appgroup /data

# INFO:sync schema to database
npx prisma db push

npx prisma studio --browser none --port 51213 &

# INFO:run program from script argument as dev user
exec runuser -u app "$@"
