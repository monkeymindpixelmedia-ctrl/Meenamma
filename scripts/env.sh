#!/usr/bin/env bash
# Maps Meenamma/.env variables (NEXT_PUBLIC_* names) onto the names the FastAPI
# backend and the pytest suite expect, and points tests at a locally-started API.
# Usage: `source scripts/env.sh` from the repo root (Meenamma/).
set -a
ENV_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.env"
while IFS='=' read -r k v; do
  case "$k" in
    NEXT_PUBLIC_SUPABASE_URL)      export SUPABASE_URL="$v"; export REACT_APP_SUPABASE_URL="$v" ;;
    NEXT_PUBLIC_SUPABASE_ANON_KEY) export REACT_APP_SUPABASE_ANON_KEY="$v" ;;
    SUPABASE_SERVICE_ROLE_KEY)     export SUPABASE_SERVICE_ROLE_KEY="$v" ;;
    RAZORPAY_KEY_ID)               export RAZORPAY_KEY_ID="$v" ;;
    RAZORPAY_KEY_SECRET)           export RAZORPAY_KEY_SECRET="$v" ;;
  esac
done < "$ENV_FILE"
export REACT_APP_BACKEND_URL="${REACT_APP_BACKEND_URL:-http://localhost:8000}"
set +a
