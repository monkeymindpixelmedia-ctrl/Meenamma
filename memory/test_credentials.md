# Test Credentials — Meenamma

## Admin account
- Email: admin@meenamma.in
- Password: TempleGold@2026
- Role: admin

## Auth endpoints
- POST /api/auth/register {name, email, password}
- POST /api/auth/login {email, password}
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/refresh

Cookies: httpOnly access_token (60 min) + refresh_token (7 days), secure, SameSite=None.

## Admin panel
- /admin route (admin role only). Admin endpoints under /api/admin/* (stats, products CRUD, bookings + status PATCH, kudams, users).

## Razorpay (TEST MODE)
- Key ID: rzp_test_TP3j9GPluzWOLf (in backend/.env)
- Test card: 4111 1111 1111 1111, any future expiry, any CVV
