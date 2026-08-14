#!/usr/bin/env bash
# Starts the Meenamma FastAPI backend locally (uvicorn on :8000) against the
# real Supabase project, using the keys mapped in scripts/env.sh.
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source scripts/env.sh
# Local dev default so the webhook endpoint is exercisable; production sets the
# real Razorpay webhook secret via the Vercel environment instead.
export RAZORPAY_WEBHOOK_SECRET="${RAZORPAY_WEBHOOK_SECRET:-test_webhook_secret}"
exec api/venv/Scripts/python.exe -m uvicorn api.index:app --host 127.0.0.1 --port 8000
