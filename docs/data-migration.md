# Migrating production data into a Coolify deployment

Copies the live database and uploaded files from the legacy droplet
(`/var/www/brpatl`, pm2 + nginx) into a deployed Coolify stack. Written for
seeding the staging environment at `metro-atlanta-saves.c4g.dev`; the same steps
apply to the eventual production cutover.

No row rewriting is needed. Every public URL shape was preserved by the
containerization work — `Image.path` keeps its `images/<uuid>.ext` form and
`/assets/<kind>/<file>` keeps its prefix — so a plain dump and restore is enough.

## Before you start

**This puts real user data on a public URL.** The dump contains user emails,
argon2 password hashes, and uploaded documents, and
`metro-atlanta-saves.c4g.dev` is reachable by anyone. That is fine for a
faithful staging environment, but it is a deliberate choice rather than a
side effect. If it is not what you want, seed a redacted subset instead.

**Leave the `MAIL_*` variables empty.** They currently are, and that is the
safety catch: `MailModule` builds its transport lazily, so an unset `MAIL_HOST`
does not stop the app booting — it makes sends fail instead. Filling them in
means a staging action can email a real user, and every link in
`mail.service.ts` is hardcoded to `https://brpatl.com`, so those emails would
point at production. Keep mail broken here on purpose.

`JWT_SECRET` stays the freshly generated staging value — do **not** copy
production's. Passwords still work, because the argon2 hashes travel in the
dump; users simply get a new session. Copying it would let a staging token
authenticate against production.

You need shell access on both the legacy droplet and the Coolify host.

---

## 0. Confirm the Postgres major version

On the droplet:

```sh
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc 'SHOW server_version'
```

`docker-compose.yaml` pins `postgres:16-alpine`. A restore into 16 works for any
source version **16 or older**. If the droplet reports 17 or newer, bump the
image tag before continuing — `pg_restore` cannot read a dump from a newer
server.

## 1. Dump the database and files (on the droplet)

Load the existing credentials, then dump. `--no-owner --no-privileges` keeps the
droplet's role names out of the dump, which otherwise fail to restore inside the
container.

```sh
set -a; . /var/www/brpatl/backend/.env; set +a

pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  --no-owner --no-privileges -Fc -f ~/mas.dump
```

The uploads live in two places that map to two different volumes. Stage each one
so the tarball root lines up with the volume root.

```sh
# Private uploads -> mas-private (backend only)
rm -rf /tmp/mas-private && mkdir -p /tmp/mas-private
cp -a /var/www/brpatl/backend/images /tmp/mas-private/
[ -d /var/www/brpatl/backend/uploads/discussion-images ] \
  && cp -a /var/www/brpatl/backend/uploads/discussion-images /tmp/mas-private/
tar czf ~/mas-private.tgz -C /tmp/mas-private .

# Public assets -> mas-assets (backend rw, frontend ro)
rm -rf /tmp/mas-assets && mkdir -p /tmp/mas-assets
for d in logo introduction stories cohorts educational-content; do
  [ -d "/var/www/brpatl/html/browser/assets/$d" ] \
    && cp -a "/var/www/brpatl/html/browser/assets/$d" /tmp/mas-assets/
done
tar czf ~/mas-assets.tgz -C /tmp/mas-assets .
```

Only those five directories are taken from the frontend asset tree. Everything
else under `browser/assets/` ships inside the image and would just shadow the
built copies with stale ones.

Do not put `images/` into `mas-assets`. That volume is mounted into the frontend
and served publicly at `/assets/*`; it would republish exactly the private files
this layout exists to protect.

## 2. Transfer

```sh
scp ~/mas.dump ~/mas-private.tgz ~/mas-assets.tgz <coolify-host>:~/
```

## 3. Identify the volumes and containers (on the Coolify host)

Coolify prefixes compose volume names with the resource UUID.

```sh
docker volume ls --format '{{.Name}}' | grep -E 'mas-(private|assets)|metro-db-data'
docker ps --format '{{.Names}}\t{{.Image}}' | grep -E 'metro-atlanta-saves|postgres'
```

Capture them, adjusting for what those printed:

```sh
DB=$(docker ps --format '{{.Names}}' | grep '^db-')
BE=$(docker ps --format '{{.Names}}' | grep '^backend-')
FE=$(docker ps --format '{{.Names}}' | grep '^frontend-')
VOL_PRIVATE=$(docker volume ls --format '{{.Name}}' | grep 'mas-private$')
VOL_ASSETS=$(docker volume ls --format '{{.Name}}' | grep 'mas-assets$')
printf 'db=%s\nbackend=%s\nfrontend=%s\nprivate=%s\nassets=%s\n' \
  "$DB" "$BE" "$FE" "$VOL_PRIVATE" "$VOL_ASSETS"
```

## 4. Stop the app, keep the database up

The backend holds open connections and would otherwise block the drop, and could
write mid-restore.

```sh
docker stop "$BE" "$FE"
```

## 5. Restore the database

The stack has already booted once, so `prisma migrate deploy` has created all 55
migrations against an empty schema. Dropping and recreating avoids merging that
with the dump's own `_prisma_migrations` table.

Every command runs the credentials *inside* the container, where
`POSTGRES_USER` and `POSTGRES_DB` are already set — so nothing sensitive lands in
your shell history.

```sh
docker exec -i "$DB" sh -c 'dropdb -U "$POSTGRES_USER" --if-exists --force "$POSTGRES_DB"'
docker exec -i "$DB" sh -c 'createdb -U "$POSTGRES_USER" -O "$POSTGRES_USER" "$POSTGRES_DB"'
docker exec -i "$DB" sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  --no-owner --no-privileges' < ~/mas.dump
```

`pg_restore` may print warnings about missing roles or extensions it cannot
recreate; those are expected with `--no-owner`. Errors mentioning `relation
already exists` are not — they mean the drop did not take.

Sanity check:

```sh
docker exec -i "$DB" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
  "SELECT (SELECT count(*) FROM users) AS users, \
          (SELECT count(*) FROM \"_prisma_migrations\") AS migrations"'
```

Expect the production user count and 55 migrations.

## 6. Restore the files

```sh
docker run --rm -v "$VOL_PRIVATE":/dst -v "$HOME":/src alpine \
  tar xzf /src/mas-private.tgz -C /dst
docker run --rm -v "$VOL_ASSETS":/dst -v "$HOME":/src alpine \
  tar xzf /src/mas-assets.tgz -C /dst
```

Confirm the split landed correctly — `images` must appear only in the first:

```sh
docker run --rm -v "$VOL_PRIVATE":/v alpine ls /v    # images, discussion-images
docker run --rm -v "$VOL_ASSETS":/v alpine ls /v     # logo, introduction, stories, ...
```

## 7. Start the app

```sh
docker start "$BE" "$FE"
docker logs -f "$BE"
```

The entrypoint runs `prisma migrate deploy` before the API starts. Because the
dump carried `_prisma_migrations`, it must report **"No pending migrations to
apply."** If it starts applying migrations instead, the restore did not take and
the schema is now a hybrid — drop the database and redo step 5.

## 8. Verify

Each of these has a distinct failure mode, so check all of them.

| Check | How | Failure means |
|---|---|---|
| API is up | `curl -s https://metro-atlanta-saves.c4g.dev/api/health` → `{"status":"ok"}` | see the Routing section in the README |
| Real login works | Sign in as a known production user | argon2 hashes did not restore |
| Legacy image rows resolve | `GET /api/images/<id>` for a pre-migration row, as its owner | `UPLOAD_DIR` join is wrong, or files went to the wrong volume |
| Private files are not public | `GET /images/<uuid>.png` with no token → **404** | the old unauthenticated static mount came back |
| Cross-user access is refused | Request another user's image id as a non-admin → **403** | the ownership check on `GET /api/images/:id` is not active |
| Public assets render | Load the home page; logo and hero images appear | `mas-assets` not mounted, or restored to the wrong root |
| sharp variants exist | `GET /api/description/logo/<name>-406w.<ext>` → 200 | resize outputs were not in the copied tree |
| Uploads survive redeploy | Redeploy in Coolify, re-run the two checks above | a volume is not actually persistent |

That last row is the one worth not skipping. If a volume is misconfigured
everything passes on the first deploy and the data disappears on the second.

## What does not come across

- **Sessions.** `JWT_SECRET` differs by design, so existing production tokens do
  not validate here. Users log in again.
- **Mail.** Deliberately non-functional; see the top of this document.
- **Most discussion images.** The old deploy step ran
  `find /var/www/brpatl/backend -mindepth 1 -not -path ".../images*" -delete`,
  which matched `uploads/discussion-images` and wiped it on *every* deploy. Those
  files are already gone in production, so posts referencing them are broken
  there too. The new layout keeps them on `mas-private`, which survives
  redeploys — so this stops happening going forward, but it cannot recover what
  was already lost.
