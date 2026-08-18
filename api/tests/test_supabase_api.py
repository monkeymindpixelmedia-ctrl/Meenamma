"""Meenamma backend API tests — Supabase migration (Jan 2026).

Auth uses Supabase GoTrue; tokens are obtained by calling the Supabase REST
password-grant endpoint directly. Backend only exposes GET /api/auth/me
(and PATCH /api/me) — no /api/auth/login endpoint anymore.
"""
import os
import uuid
import requests
import pytest
from pathlib import Path
from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(_ROOT / ".env.local")
load_dotenv(_ROOT / ".env")
load_dotenv("/app/frontend/.env")

BASE_URL = os.getenv("REACT_APP_BACKEND_URL", os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:8000")).rstrip("/")
API = f"{BASE_URL}/api"

SUPABASE_URL = os.getenv("REACT_APP_SUPABASE_URL", os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")).rstrip("/")
SUPABASE_ANON = os.getenv("REACT_APP_SUPABASE_ANON_KEY", os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""))

DEMO_EMAIL = "demo@meenamma.in"
DEMO_PASSWORD = "meenamma2026"
ADMIN_EMAIL = "admin@meenamma.in"
ADMIN_PASSWORD = "TempleGold@2026"


# ---------- helpers ----------
def supabase_login(email: str, password: str) -> str:
    r = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": SUPABASE_ANON, "Content-Type": "application/json"},
        json={"email": email, "password": password},
        timeout=15,
    )
    assert r.status_code == 200, f"Supabase login failed {email}: {r.status_code} {r.text}"
    return r.json()["access_token"]


def supabase_signup(email: str, password: str) -> str:
    r = requests.post(
        f"{SUPABASE_URL}/auth/v1/signup",
        headers={"apikey": SUPABASE_ANON, "Content-Type": "application/json"},
        json={"email": email, "password": password},
        timeout=15,
    )
    assert r.status_code in (200, 201), f"signup failed: {r.status_code} {r.text}"
    body = r.json()
    if body.get("access_token"):
        return body["access_token"]
    # some projects auto-confirm; if session missing try login
    return supabase_login(email, password)


@pytest.fixture(scope="module")
def demo_token():
    return supabase_login(DEMO_EMAIL, DEMO_PASSWORD)


@pytest.fixture(scope="module")
def admin_token():
    return supabase_login(ADMIN_EMAIL, ADMIN_PASSWORD)


@pytest.fixture(scope="module")
def demo_headers(demo_token):
    return {"Authorization": f"Bearer {demo_token}"}


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- Health & public ----------
def test_health():
    r = requests.get(f"{API}/health")
    assert r.status_code == 200
    j = r.json()
    assert j["status"] == "ok"
    assert j.get("db") == "supabase"


def test_products_public_15_seeded():
    r = requests.get(f"{API}/products")
    assert r.status_code == 200, r.text
    prods = r.json()
    assert len(prods) >= 15, f"expected >=15 seeded products, got {len(prods)}"
    for p in prods:
        assert "id" in p and "name" in p and "price_per_kg" in p
        assert p["price_per_kg"] > 0


def test_stats_live_public():
    r = requests.get(f"{API}/stats/live")
    assert r.status_code == 200, r.text
    j = r.json()
    for k in ("catches_live", "harbours", "households", "saved_rupees", "kg_reserved", "kudams_filled"):
        assert k in j, f"missing {k}"
    # catches_live counts *published* products; Kaala is intentionally off-season
    # (see test_reservations.py), so 14 published is the current fixture.
    assert j["catches_live"] >= 14


# ---------- Auth guards ----------
def test_me_requires_auth():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_me_invalid_token():
    r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert r.status_code == 401


def test_kudams_requires_auth():
    r = requests.get(f"{API}/kudams")
    assert r.status_code == 401


def test_admin_requires_admin(demo_headers):
    r = requests.get(f"{API}/admin/stats", headers=demo_headers)
    assert r.status_code == 403


# ---------- /auth/me + PATCH /me ----------
def test_me_demo(demo_headers):
    r = requests.get(f"{API}/auth/me", headers=demo_headers)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["email"] == DEMO_EMAIL
    assert j["role"] == "user"
    assert "id" in j


def test_me_admin(admin_headers):
    r = requests.get(f"{API}/auth/me", headers=admin_headers)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["email"] == ADMIN_EMAIL
    assert j["role"] == "admin"


def test_patch_me_updates_name_persist(demo_headers):
    original = requests.get(f"{API}/auth/me", headers=demo_headers).json()
    new_name = f"Demo Family {uuid.uuid4().hex[:4]}"
    r = requests.patch(f"{API}/me", headers=demo_headers, json={"name": new_name})
    assert r.status_code == 200, r.text
    assert r.json()["name"] == new_name
    # persistence via GET
    r2 = requests.get(f"{API}/auth/me", headers=demo_headers)
    assert r2.json()["name"] == new_name
    # restore
    requests.patch(f"{API}/me", headers=demo_headers, json={"name": original["name"] or "Demo Family"})


# ---------- Kudams ----------
def test_demo_kudams_include_sunday_feast(demo_headers):
    r = requests.get(f"{API}/kudams", headers=demo_headers)
    assert r.status_code == 200
    kudams = r.json()
    sunday = next((k for k in kudams if k["name"] == "Sunday Feast"), None)
    assert sunday, f"Sunday Feast missing: {[k['name'] for k in kudams]}"
    assert sunday["goal_amount"] == 500
    assert 300 <= sunday["saved_amount"] <= 500


def test_create_kudam(demo_headers):
    name = f"TEST_Kudam_{uuid.uuid4().hex[:6]}"
    r = requests.post(f"{API}/kudams", headers=demo_headers, json={"name": name, "goal_amount": 1500})
    assert r.status_code == 200, r.text
    k = r.json()
    assert k["name"] == name
    assert k["goal_amount"] == 1500
    assert k["saved_amount"] == 0
    assert "id" in k
    # confirm in list
    lst = requests.get(f"{API}/kudams", headers=demo_headers).json()
    assert any(x["id"] == k["id"] for x in lst)


def test_rewards_status(demo_headers):
    r = requests.get(f"{API}/rewards/status", headers=demo_headers)
    assert r.status_code == 200
    j = r.json()
    assert "discount_percent" in j


# ---------- Bookings + Payments ----------
def test_bookings_list(demo_headers):
    r = requests.get(f"{API}/bookings", headers=demo_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_create_deposit_order(demo_headers):
    kudams = requests.get(f"{API}/kudams", headers=demo_headers).json()
    assert kudams
    kid = kudams[0]["id"]
    r = requests.post(f"{API}/payments/create-order", headers=demo_headers,
                      json={"purpose": "deposit", "amount": 25, "kudam_id": kid})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["order_id"].startswith("order_")
    assert d["amount"] == 2500
    assert d.get("currency") == "INR"
    assert d.get("key_id", "").startswith("rzp_test_")


def test_create_booking_order_server_side_amount(demo_headers):
    prods = requests.get(f"{API}/products").json()
    prod = prods[0]
    r = requests.post(f"{API}/payments/create-order", headers=demo_headers, json={
        "purpose": "booking", "product_id": prod["id"], "qty_kg": 0.5,
        "pickup_date": "2026-02-10",
    })
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["order_id"].startswith("order_")
    # discount may be 0 or 20 depending on reward state — accept either
    dp = d.get("discount_percent", 0)
    expected_no_disc = max(1, round(prod["price_per_kg"] * 0.5)) * 100
    expected_disc = max(1, round(prod["price_per_kg"] * 0.5 * 0.8)) * 100
    assert d["amount"] in (expected_no_disc, expected_disc), \
        f"amount {d['amount']} not in {expected_no_disc}/{expected_disc}"


def test_verify_invalid_signature(demo_headers):
    kudams = requests.get(f"{API}/kudams", headers=demo_headers).json()
    kid = kudams[0]["id"]
    o = requests.post(f"{API}/payments/create-order", headers=demo_headers,
                      json={"purpose": "deposit", "amount": 10, "kudam_id": kid}).json()
    r = requests.post(f"{API}/payments/verify", headers=demo_headers, json={
        "razorpay_order_id": o["order_id"],
        "razorpay_payment_id": "pay_FAKE0000000000",
        "razorpay_signature": "invalid_sig_xxxxxxxxxxxxxxxxxxxxxxxx",
    })
    assert r.status_code == 400, f"expected 400 got {r.status_code} {r.text}"


def test_create_order_bad_purpose(demo_headers):
    r = requests.post(f"{API}/payments/create-order", headers=demo_headers,
                      json={"purpose": "junk", "amount": 100})
    assert r.status_code == 400


def test_create_order_deposit_missing_kudam(demo_headers):
    r = requests.post(f"{API}/payments/create-order", headers=demo_headers,
                      json={"purpose": "deposit", "amount": 100})
    assert r.status_code == 400


# ---------- Admin suite ----------
def test_admin_stats(admin_headers):
    r = requests.get(f"{API}/admin/stats", headers=admin_headers)
    assert r.status_code == 200, r.text
    j = r.json()
    for k in ("users", "bookings", "booking_revenue", "total_saved", "products"):
        assert k in j
    assert j["products"] >= 15


def test_admin_bookings(admin_headers):
    r = requests.get(f"{API}/admin/bookings", headers=admin_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_admin_kudams(admin_headers):
    r = requests.get(f"{API}/admin/kudams", headers=admin_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_admin_users(admin_headers):
    r = requests.get(f"{API}/admin/users", headers=admin_headers)
    assert r.status_code == 200
    users = r.json()
    assert isinstance(users, list)
    assert any(u["email"] == DEMO_EMAIL for u in users)


def test_admin_product_create_update_delete(admin_headers):
    # CREATE
    payload = {
        "name": f"TEST_Fish_{uuid.uuid4().hex[:6]}",
        "tamil_name": "டெஸ்ட்",
        "price_per_kg": 900,
        "image": "https://example.com/x.jpg",
        "origin": "Test Harbour",
        "story": "test story",
        "handling": "cleaned",
        "available": True,
    }
    r = requests.post(f"{API}/admin/products", headers=admin_headers, json=payload)
    assert r.status_code == 200, r.text
    p = r.json()
    pid = p["id"]
    assert p["name"] == payload["name"]
    assert p["price_per_kg"] == 900

    try:
        # Appears in public /products
        lst = requests.get(f"{API}/products").json()
        assert any(x["id"] == pid for x in lst)

        # UPDATE price
        payload["price_per_kg"] = 1200
        r = requests.put(f"{API}/admin/products/{pid}", headers=admin_headers, json=payload)
        assert r.status_code == 200, r.text
        assert r.json()["price_per_kg"] == 1200
    finally:
        # DELETE (archive)
        r = requests.delete(f"{API}/admin/products/{pid}", headers=admin_headers)
        assert r.status_code == 200, r.text
        lst = requests.get(f"{API}/products").json()
        assert not any(x["id"] == pid for x in lst), "archived product still visible in /products"


def test_admin_upload_image(admin_headers):
    import io
    png = bytes.fromhex(
        "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
        "0000000d49444154789c62000100000005000104ea0f5fd80000000049454e44ae426082"
    )
    files = {"file": ("test.png", io.BytesIO(png), "image/png")}
    r = requests.post(f"{API}/admin/upload", headers=admin_headers, files=files)
    assert r.status_code == 200, r.text
    url = r.json()["url"]
    assert url.startswith("/api/uploads/")
    r2 = requests.get(f"{BASE_URL}{url}")
    assert r2.status_code == 200
    assert r2.content == png


def test_admin_upload_rejects_txt(admin_headers):
    import io
    files = {"file": ("bad.txt", io.BytesIO(b"hello"), "text/plain")}
    r = requests.post(f"{API}/admin/upload", headers=admin_headers, files=files)
    assert r.status_code == 400


def test_admin_upload_non_admin_forbidden(demo_headers):
    import io
    files = {"file": ("t.png", io.BytesIO(b"\x89PNG"), "image/png")}
    r = requests.post(f"{API}/admin/upload", headers=demo_headers, files=files)
    assert r.status_code == 403
