# Auth Testing Playbook (Meenamma)

## Credentials
- Admin: admin@meenamma.in / TempleGold@2026

## Step 1: MongoDB Verification
```
mongosh
use meenamma
db.users.find({role: "admin"}).pretty()
```
Verify: bcrypt hash starts with `$2b$`, unique index on users.email.

## Step 2: API Testing
```
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@meenamma.in","password":"TempleGold@2026"}'
curl -b cookies.txt http://localhost:8001/api/auth/me
```
Login sets access_token + refresh_token httpOnly cookies. /me returns the user.

## Endpoints
- POST /api/auth/register {name,email,password}
- POST /api/auth/login {email,password}
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/refresh

## Brute force
5 failed logins per ip:email → 15 min lockout (HTTP 429).
