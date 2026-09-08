#!/usr/bin/env bash
# Apply the Prisma migration history to a Turso database.
#
# Usage:  ./scripts/db-push-turso.sh <turso-db-name>
#
# Requires the Turso CLI:  curl -sSfL https://get.tur.so/install.sh | bash
# and `turso auth login`.

set -euo pipefail

DB="${1:?Usage: $0 <turso-db-name>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Applying migrations to Turso database: $DB"
# Migration folders are timestamp-prefixed, so glob order == chronological order.
cat "$ROOT"/prisma/migrations/*/migration.sql | turso db shell "$DB"

echo "Done. Verify with:  turso db shell $DB \".tables\""
