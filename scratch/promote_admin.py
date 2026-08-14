import os
from pathlib import Path
from supabase import create_client

def load_env(path, variables):
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].lstrip()
        name, sep, val = line.partition("=")
        name = name.strip()
        val = val.strip()
        if len(val) >= 2 and val[0] == val[-1] and val[0] in "\"'":
            val = val[1:-1]
        variables[name] = val

def main():
    variables = {}
    load_env(Path(".env"), variables)
    load_env(Path(".env.local"), variables)

    supabase_url = variables.get("NEXT_PUBLIC_SUPABASE_URL") or variables.get("SUPABASE_URL")
    supabase_key = variables.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env files.")
        return

    sb = create_client(supabase_url, supabase_key)
    email = "rathnavelkarthi1@gmail.com"

    # Find profile
    res = sb.table("profiles").select("id, display_name").eq("email", email).execute()
    profiles = res.data

    if not profiles:
        print(f"Error: User with email '{email}' does not have a registered profile yet.")
        print("Please sign up first using this email, then run this promotion script again.")
        return

    user_id = profiles[0]["id"]
    display_name = profiles[0]["display_name"]
    print(f"Found profile: ID={user_id}, Name={display_name}")

    # Check existing role assignment
    existing = sb.table("staff_role_assignments").select("id").eq("profile_id", user_id).eq("role", "ops_admin").is_("revoked_at", "null").execute().data
    if existing:
        print(f"User '{email}' is already an active admin.")
        return

    # Grant admin role
    sb.table("staff_role_assignments").insert({
        "profile_id": user_id,
        "role": "ops_admin",
        "granted_by": user_id
    }).execute()
    
    print(f"Successfully promoted user '{email}' to ops_admin.")

if __name__ == "__main__":
    main()
