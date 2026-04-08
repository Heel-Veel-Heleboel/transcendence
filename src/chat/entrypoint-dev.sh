#!/bin/sh

# INFO:give dev user access to data volume
chown -R app:appgroup /data

npm run db:push

# INFO:run program from script argument as dev user
exec runuser -u app -- "$@"
