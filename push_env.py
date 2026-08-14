import os, subprocess

with open('.env', 'r') as f:
    lines = f.read().splitlines()

env_vars = {}
for line in lines:
    if line.startswith('NEXT_PUBLIC_SUPABASE_URL='):
        env_vars['SUPABASE_URL'] = line.split('=', 1)[1]
        env_vars['REACT_APP_SUPABASE_URL'] = line.split('=', 1)[1]
    elif line.startswith('NEXT_PUBLIC_SUPABASE_ANON_KEY='):
        env_vars['REACT_APP_SUPABASE_ANON_KEY'] = line.split('=', 1)[1]
    elif line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
        env_vars['SUPABASE_SERVICE_ROLE_KEY'] = line.split('=', 1)[1]
    elif line.startswith('RAZORPAY_KEY_ID='):
        env_vars['RAZORPAY_KEY_ID'] = line.split('=', 1)[1]
    elif line.startswith('RAZORPAY_KEY_SECRET='):
        env_vars['RAZORPAY_KEY_SECRET'] = line.split('=', 1)[1]

# Also push to preview and development environments
envs_to_push = ['production', 'preview', 'development']

for env in envs_to_push:
    for k, v in env_vars.items():
        print(f"Adding {k} to {env}...")
        p = subprocess.Popen(['npx.cmd', 'vercel', 'env', 'add', k, env], stdin=subprocess.PIPE, text=True)
        p.communicate(input=v)
