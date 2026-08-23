#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../../career-coach"

if [[ ! -f .env.local ]]; then
  cp .env.example .env.local
fi

# JSON storage for Cloud Agent dev. Comment placeholder DATABASE_URL from .env.example
# so getStorageBackend() does not prefer postgres over STORAGE_BACKEND=json.
if grep -q '^DATABASE_URL=' .env.local; then
  sed -i 's/^DATABASE_URL=/# DATABASE_URL=/' .env.local
fi

if ! grep -q '^STORAGE_BACKEND=' .env.local; then
  printf '\nSTORAGE_BACKEND=json\n' >> .env.local
fi

npm ci
