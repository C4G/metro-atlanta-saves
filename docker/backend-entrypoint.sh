#!/bin/sh
# Apply any pending Prisma migrations before the API starts serving. Replaces
# the `nx run backend:prisma-deploy` step the old CD workflow ran on the host.
set -e

echo "----- Applying database migrations -----"
./node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma

exec "$@"
