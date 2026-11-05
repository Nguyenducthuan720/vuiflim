#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
umask 077
mkdir -p backups
target="backups/vuiphim-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
# A failed dump must not be mistaken for a complete backup.
temporary="${target}.partial"
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > "${temporary}.sql"
gzip -c "${temporary}.sql" > "$temporary"
mv "$temporary" "$target"
rm -f "${temporary}.sql"
printf 'Backup saved: %s\n' "$target"
