"""Compare Meenamma profiles with Supabase Auth and optionally invite missing users."""

import argparse
import os
import sys
from pathlib import Path
from typing import Iterable, Set

from supabase import create_client

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.runtime_env import load_runtime_env


PAGE_SIZE = 1000


def normalized_emails(rows: Iterable[object]) -> Set[str]:
    emails = set()
    for row in rows:
        email = row.get("email") if isinstance(row, dict) else getattr(row, "email", None)
        if email:
            emails.add(str(email).strip().lower())
    return emails


def missing_emails(profile_rows: Iterable[object], auth_users: Iterable[object]) -> list[str]:
    return sorted(normalized_emails(profile_rows) - normalized_emails(auth_users))


def list_auth_users(admin) -> list[object]:
    users = []
    page = 1
    while True:
        batch = admin.list_users(page=page, per_page=PAGE_SIZE)
        users.extend(batch)
        if len(batch) < PAGE_SIZE:
            return users
        page += 1


def run(apply: bool) -> int:
    load_runtime_env()
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not service_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")

    client = create_client(url, service_key)
    profiles = client.table("profiles").select("email").execute().data
    auth_users = list_auth_users(client.auth.admin)
    missing = missing_emails(profiles, auth_users)
    print(f"profiles={len(normalized_emails(profiles))} auth_users={len(auth_users)} missing={len(missing)}")

    if not missing:
        return 0
    for email in missing:
        if not apply:
            print(f"DRY RUN invite {email}")
            continue
        try:
            client.auth.admin.invite_user_by_email(email)
            print(f"INVITED {email}")
        except Exception as error:
            print(f"FAILED {email}: {error}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--apply",
        action="store_true",
        help="send Supabase invitation emails; default is a read-only dry run",
    )
    return run(apply=parser.parse_args().apply)


if __name__ == "__main__":
    raise SystemExit(main())
