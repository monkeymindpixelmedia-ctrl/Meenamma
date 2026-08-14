import subprocess
from pathlib import Path


ENV_FILES = (".env", ".env.local")
VERCEL_TARGETS = ("production", "preview", "development")
DEPLOYMENT_VARIABLES = {
    "NEXT_PUBLIC_SUPABASE_URL": ("SUPABASE_URL", "REACT_APP_SUPABASE_URL"),
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": ("REACT_APP_SUPABASE_ANON_KEY",),
    "SUPABASE_SERVICE_ROLE_KEY": ("SUPABASE_SERVICE_ROLE_KEY",),
    "RAZORPAY_KEY_ID": ("RAZORPAY_KEY_ID",),
    "RAZORPAY_KEY_SECRET": ("RAZORPAY_KEY_SECRET",),
    "GOOGLE_CLIENT_ID": ("GOOGLE_CLIENT_ID",),
    "GOOGLE_CLIENT_SECRET": ("GOOGLE_CLIENT_SECRET",),
}


def load_env_file(path):
    values = {}
    try:
        lines = Path(path).read_text(encoding="utf-8-sig").splitlines()
    except FileNotFoundError:
        return values

    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].lstrip()

        name, separator, value = line.partition("=")
        name = name.strip()
        if not separator or name not in DEPLOYMENT_VARIABLES:
            continue

        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        values[name] = value

    return values


def load_deployment_variables(directory="."):
    local_values = {}
    root = Path(directory)
    for filename in ENV_FILES:
        local_values.update(load_env_file(root / filename))

    deployment_values = {}
    for source_name, deployment_names in DEPLOYMENT_VARIABLES.items():
        if source_name not in local_values:
            continue
        for deployment_name in deployment_names:
            deployment_values[deployment_name] = local_values[source_name]
    return deployment_values


def sync_to_vercel(deployment_values):
    for target in VERCEL_TARGETS:
        for name, value in deployment_values.items():
            print(f"Syncing {name} to {target}...")
            subprocess.run(
                ["npx.cmd", "vercel", "env", "add", name, target, "--force"],
                input=value,
                text=True,
                check=True,
            )


def main():
    sync_to_vercel(load_deployment_variables())


if __name__ == "__main__":
    main()
