#!/usr/bin/env bash
# Deploy Aura Expo Web export to Cloudflare Pages (aura-templari).
# Mirrors HL / Auspex / Aleph / Numerology / Graphology pattern.

set -euo pipefail

PROJECT_NAME="aura-templari"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

ENV_FILE=$(mktemp)
jq -r '.build.production.env // {} | to_entries[] | "export \(.key)=\(.value|@sh)"' eas.json > "$ENV_FILE"
# shellcheck disable=SC1090
source "$ENV_FILE"
rm -f "$ENV_FILE"

# shellcheck disable=SC1091
source ~/.env
export CLOUDFLARE_API_TOKEN
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-682708b342ed88e9bc1517adb845ee13}"

rm -rf dist
npx expo export -p web

if [ -d dist/assets/node_modules ]; then
  mv dist/assets/node_modules dist/assets/vendor
  BUNDLE=$(ls dist/_expo/static/js/web/entry-*.js | head -1)
  sed -i 's|assets/node_modules|assets/vendor|g' "$BUNDLE"
fi

COMMIT_HASH=$(git -C . log -1 --format=%H)
npx wrangler pages deploy dist \
  --project-name "$PROJECT_NAME" \
  --branch main \
  --commit-dirty=true \
  --commit-hash="$COMMIT_HASH"
