#!/usr/bin/env bash
# Runs the Meenamma backend pytest suite (live integration tests) against a
# locally-started API (scripts/start_api.sh) and the real Supabase project.
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source scripts/env.sh
api/venv/Scripts/python.exe -m pytest api/tests -q -p no:cacheprovider "$@"
