# Backing up and restoring application data

Covers taking a verified backup of the database and uploaded files, and
restoring it into a Coolify deployment. Two situations use this:

- **Rebuilding or replacing the production host** — back up, rebuild, restore
  onto the same machine. This is what the August 2026 migration did.
- **Seeding staging from production** — the same backup, restored onto the
  shared Coolify host at `metro-atlanta-saves.c4g.dev`.

No row rewriting is needed in either case. Every public URL shape was preserved
by the containerization work — `Image.path` keeps its `images/<uuid>.ext` form
and `/assets/<kind>/<file>` keeps its prefix — so a plain dump and restore is
enough.

## Before you start

**If the destination is staging, this puts real user data on a public URL.**
The dump contains user emails, argon2 password hashes, and uploaded documents,
and `metro-atlanta-saves.c4g.dev` is reachable by anyone. That is fine for a
faithful staging environment, but it is a deliberate choice rather than a side
effect. If it is not what you want, seed a redacted subset instead.

**On staging, leave the `MAIL_*` variables empty.** `MailModule` builds its
transport lazily, so an unset `MAIL_HOST` does not stop the app booting — it
makes sends fail instead. Filling them in means a staging action can email a
real user, and every link in `mail.service.ts` is hardcoded to
`https://brpatl.com`, so those emails would point at production. Keep mail
broken there on purpose. Production, of course, needs the real values.

**`JWT_SECRET` rules differ by destination.** Production must keep its existing
value — tokens are signed with `expiresIn: '1y'`, so a new secret logs out every
user. Staging must use a *fresh* one: copying production's would let a staging
token authenticate against production. Passwords work either way, because the
argon2 hashes travel in the dump.

The same applies to the `VAPID_*` trio. Push subscriptions are bound to the
application server key, so production must keep its pair or every existing
subscription silently stops working. Verify the pair actually matches before
relying on it — a mismatched public/private pair looks fine until a send fails:

```sh
python3 - <<'PY'
import base64
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
b64u = lambda s: base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))
pub, priv = b64u("<VAPID_PUBLIC_KEY>"), b64u("<VAPID_PRIVATE_KEY>")
k = ec.derive_private_key(int.from_bytes(priv, "big"), ec.SECP256R1())
print("match:", k.public_key().public_bytes(
    serialization.Encoding.X962,
    serialization.PublicFormat.UncompressedPoint) == pub)
PY
```

---

## 1. Take the backup

Run this on the host holding the live data. `$DB` is the Postgres container —
`db-<app-uuid>-<n>` for a Coolify stack.

`pg_dump` is transactionally consistent, so a dump taken while the app is
running is a valid point-in-time snapshot. For a **cutover**, still stop the
application first, so nothing is written between the dump and the switch.

```sh
DB=$(docker ps --format '{{.Names}}' | grep '^db-')
BK=/root/backup-$(date -u +%Y%m%dT%H%M%SZ); mkdir -p "$BK"

# Custom format — the one that gets restored.
docker exec "$DB" sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges -Fc' \
  > "$BK/mas-db.dump"

# Plain SQL as a hedge against a custom-format file that will not read back.
docker exec "$DB" sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges' \
  | gzip -9 > "$BK/mas-db.sql.gz"
```

Two things that will bite:

- **No `-t` on `docker exec`.** A TTY corrupts the binary custom-format stream.
- **No `-i` either, if the surrounding script is being piped in over stdin**
  (`ssh host 'bash -s' < script.sh`). With `-i` the container inherits the
  script's stdin and swallows the rest of the file, so the script stops
  mid-way with no error. Copy the script to the host and run it from a file.

`--no-owner --no-privileges` keeps the source role names out of the dump, which
would otherwise fail to restore under a different role.

Record the numbers the restore will be checked against:

```sh
docker exec "$DB" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAF, -c "
   SELECT '\''users'\'', count(*) FROM users
   UNION ALL SELECT '\''images'\'', count(*) FROM images
   UNION ALL SELECT '\''programs'\'', count(*) FROM programs
   UNION ALL SELECT '\''partners'\'', count(*) FROM partners
   UNION ALL SELECT '\''migrations'\'', count(*) FROM _prisma_migrations
   ORDER BY 1"' > "$BK/row-counts.csv"

docker exec "$DB" sh -c \
  'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT path FROM images ORDER BY path"' \
  > "$BK/image-paths.txt"
```

Then the uploaded files. Take **everything** under each root — choosing a
subset is a restore-time decision, and a backup that silently drops data it did
not understand is not a backup.

```sh
# From a Coolify deployment, the files live on named volumes:
docker run --rm -v <app-uuid>_mas-private:/v -v "$BK":/out alpine \
  tar czf /out/backend-uploads.tgz -C /v --exclude=./assets .
docker run --rm -v <app-uuid>_mas-assets:/v  -v "$BK":/out alpine \
  tar czf /out/frontend-assets.tgz -C /v .

( cd "$BK" && sha256sum ./* > SHA256SUMS )
```

`mas-assets` is mounted *inside* `mas-private` at `assets/`, so exclude it from
the private tarball or it is captured twice.

Copy the whole directory off the host, and verify `sha256sum -c SHA256SUMS`
on arrival.

## 2. Prove the backup restores

**Do this before destroying anything.** Checksums prove the bytes survived the
copy; they say nothing about whether `pg_restore` can read the file. Restore it
into a throwaway container — ideally on a different machine, which also proves
the dump does not depend on its source host:

```sh
docker run -d --name restore-test \
  -e POSTGRES_PASSWORD=throwaway -e POSTGRES_USER=testuser -e POSTGRES_DB=testdb \
  postgres:16-alpine
until docker exec restore-test pg_isready -U testuser -d testdb; do sleep 1; done

docker cp mas-db.dump restore-test:/tmp/
docker exec restore-test pg_restore -U testuser -d testdb \
  --no-owner --no-privileges /tmp/mas-db.dump      # expect NO output at all
```

Then read it back. Row counts must match `row-counts.csv` exactly, and:

```sh
docker exec restore-test psql -U testuser -d testdb -tAF, -c "
  SELECT count(*), 
         count(*) FILTER (WHERE hash LIKE '\$argon2id\$v=19\$m=65536%'),
         min(length(hash)), max(length(hash))
  FROM users"
```

Every hash must be well-formed and `min(length) = max(length) = 97`. A
truncating restore still yields the right *number* of users and still looks
fine — until nobody can log in.

Finish with `docker rm -f restore-test`.

## 3. Restore into a Coolify deployment

Deploy the stack first so Coolify creates the containers and volumes. On the
first boot the backend will run `prisma migrate deploy` against an empty
database and apply every migration; that is expected, and the restore drops it.

```sh
APP=<app-uuid>
DB=$(docker ps --format '{{.Names}}' | grep "^db-$APP")
BE=$(docker ps --format '{{.Names}}' | grep "^backend-$APP")
FE=$(docker ps --format '{{.Names}}' | grep "^frontend-$APP")
VOL_PRIVATE=${APP}_mas-private
VOL_ASSETS=${APP}_mas-assets

# The backend holds open connections and would block the drop, and could
# write mid-restore. The database stays up.
docker stop "$BE" "$FE"

docker exec "$DB" sh -c 'dropdb -U "$POSTGRES_USER" --if-exists --force "$POSTGRES_DB"'
docker exec "$DB" sh -c 'createdb -U "$POSTGRES_USER" -O "$POSTGRES_USER" "$POSTGRES_DB"'
docker exec -i "$DB" sh -c \
  'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges' \
  < "$BK/mas-db.dump"
```

Dropping and recreating avoids merging the first-boot schema with the dump's own
`_prisma_migrations` table. Warnings about missing roles or extensions are
expected with `--no-owner`; errors saying `relation already exists` are not —
they mean the drop did not take.

Then the files. Note the split: putting `images/` into `mas-assets` by mistake
would republish, at `/assets/*`, exactly the private files this layout exists to
protect.

```sh
docker run --rm -v "$VOL_PRIVATE":/dst -v "$BK":/src:ro alpine \
  tar xzf /src/backend-uploads.tgz -C /dst

# Only the five upload-managed directories. Everything else under
# browser/assets/ ships inside the frontend image; restoring it would shadow
# the built copies with stale ones.
docker run --rm -v "$VOL_ASSETS":/dst -v "$BK":/src:ro alpine sh -c '
  rm -rf /tmp/a && mkdir -p /tmp/a &&
  tar xzf /src/frontend-assets.tgz -C /tmp/a &&
  for d in logo introduction stories cohorts educational-content; do
    [ -d "/tmp/a/$d" ] && cp -a "/tmp/a/$d" /dst/ || true
  done'

docker start "$BE" "$FE"
```

The backend must now log **"No pending migrations to apply."** If it starts
applying migrations instead, the restore did not take and the schema is a
hybrid — drop the database and redo this step.

> Production carries **57** rows in `_prisma_migrations` while the repo has 55
> migration directories. `20260318204137_peer_evaluation_guide` was applied,
> then renamed to `_dev`; the rename failed with `relation
> "PeerEvaluationGuide" already exists` and was patched with `migrate resolve`.
> It is non-blocking because `rolled_back_at` is set. What matters is that
> `finished_at IS NULL AND rolled_back_at IS NULL` returns **0** rows.

## 4. Verify

Each of these has a distinct failure mode, so check all of them.

| Check | How | Failure means |
|---|---|---|
| API is up | `curl -s https://<domain>/api/health` → `{"status":"ok"}` | see the Routing section in the README |
| Every image row has a file | compare `image-paths.txt` against `find images -type f` on `mas-private` — the difference must be empty | `UPLOAD_DIR` join is wrong, or files went to the wrong volume |
| Real login works | sign in as a known production user | argon2 hashes did not restore, or `JWT_SECRET` changed |
| Private files are not public | `GET /images/<uuid>.jpg` with no token — check the **content type**, not the status | see below |
| Guarded API needs auth | `GET /api/images/1` with no token → **401** | the `JwtGuard` is not applied |
| Cross-user access refused | request another user's image id as a non-admin → **403** | the ownership check on `GET /api/images/:id` is not active |
| Public assets render | `GET /assets/logo/<file>` → `image/*` | `mas-assets` not mounted, or restored to the wrong root |
| sharp variants exist | `GET /api/description/logo/<name>-406w.webp` and `-812w` → 200, and **three different sizes** | resize outputs were not in the copied tree |
| **Uploads survive redeploy** | redeploy in Coolify, then re-run the two checks above | **a volume is not actually persistent** |

That last row is the one worth not skipping. If a volume is misconfigured
everything passes on the first deploy and the data disappears on the second.

The file reconciliation is worth scripting, since it is the check that proves
the database and the disk agree:

```sh
docker run --rm -v "$VOL_PRIVATE":/v alpine sh -c 'cd /v && find images -type f' \
  | sort > /tmp/vol-files.txt
comm -23 <(sort "$BK/image-paths.txt") /tmp/vol-files.txt   # must be empty
```

More files than rows is normal — uploads whose row was later deleted stay on
disk. The August 2026 restore had 224 rows against 248 files, 0 missing.

### Checking "private files are not public" correctly

A private path returns **200, not 404** — the Angular SSR catch-all renders the
app shell for any unmatched route. Status code alone tells you nothing. Compare
the content type and size against a known-good asset and a path that certainly
does not exist:

```sh
B=https://brpatl.com
for u in "/images/<uuid>.jpg" "/assets/logo/<logo>.webp" "/definitely-not-real"; do
  printf '%-44s ' "$u"
  curl -s -o /dev/null -w '%{content_type} %{size_download}\n' "$B$u"
done
```

The private path must come back as `text/html` at roughly the same size as the
nonsense path — that is the SPA shell, meaning nothing was served. If it returns
an `image/*` content type, the file is genuinely exposed.

## What does not come across

- **Sessions**, when `JWT_SECRET` differs by design (staging). Users log in again.
- **Mail**, on staging. Deliberately non-functional; see the top of this document.
- **Most discussion images.** The pre-container deploy step ran
  `find /var/www/brpatl/backend -mindepth 1 -not -path ".../images*" -delete`,
  which matched `uploads/discussion-images` and wiped it on *every* deploy.
  Those files were already gone before the migration, so posts referencing them
  were broken in production too. The new layout keeps them on `mas-private`,
  which survives redeploys — so this stops happening going forward, but it
  cannot recover what was already lost.
