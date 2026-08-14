#!/usr/bin/env bash
# Starts the Meenamma FastAPI backend locally (uvicorn on :8000) against the
# real Supabase project, using the keys mapped in scripts/env.sh.
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source scripts/env.sh
exec api/venv/Scripts/python.exe -m uvicorn api.index:app --host 127.0.0.1 --port 8000
