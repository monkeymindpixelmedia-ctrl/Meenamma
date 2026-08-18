"""Reservation lifecycle + regression tests for off-season catch feature (Jan 2026)."""
import os
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


def _login(email, password):
    r = requests.post(f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
                      headers={"apikey": SUPABASE_ANON, "Content-Type": "application/json"},
                      json={"email": email, "password": password}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def demo_headers():
    return {"Authorization": f"Bearer {_login(DEMO_EMAIL, DEMO_PASSWORD)}"}


@pytest.fixture(scope="module")
def admin_headers():
    return {"Authorization": f"Bearer {_login(ADMIN_EMAIL, ADMIN_PASSWORD)}"}


@pytest.fixture(scope="module")
def products():
    r = requests.get(f"{API}/products")
    assert r.status_code == 200
    return r.json()


# ---------- Regression ----------
def test_stats_live_200():
    r = requests.get(f"{API}/stats/live")
    assert r.status_code == 200
    assert r.json()["catches_live"] >= 14


def test_products_include_kaala_unavailable(products):
    # Kaala is off-season -> unavailable (available=False in output)
    kaala = next((p for p in products if p["name"].lower() == "kaala"), None)
    assert kaala, f"Kaala not found in products list: {[p['name'] for p in products]}"
    assert kaala.get("available") is False, f"Kaala must be unavailable (off-season). Got: {kaala}"
    # 14 published + Kaala + possibly others; per spec 15 total
    assert len(products) >= 15, f"expected >=15 products, got {len(products)}"


def test_admin_stats(admin_headers):
    r = requests.get(f"{API}/admin/stats", headers=admin_headers)
    assert r.status_code == 200


# ---------- Reservation lifecycle ----------
def test_reservation_create_order_for_kaala(demo_headers, products):
    kaala = next((p for p in products if p["name"].lower() == "kaala"), None)
    assert kaala, "Kaala missing"
    qty = 1.0
    price = kaala["price_per_kg"]
    r = requests.post(f"{API}/reservations/create-order", headers=demo_headers,
                      json={"product_id": kaala["id"], "qty_kg": qty})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["order_id"].startswith("order_")
    expected_advance = max(100, round(price * qty * 100 * 0.25))
    assert d["amount"] == expected_advance, f"advance {d['amount']} != {expected_advance} (25% of {price*qty*100})"
    assert d["currency"] == "INR"
    assert d["key_id"].startswith("rzp_test_")


def test_reservation_create_order_404(demo_headers):
    r = requests.post(f"{API}/reservations/create-order", headers=demo_headers,
                      json={"product_id": "00000000-0000-0000-0000-000000000000", "qty_kg": 1})
    assert r.status_code in (404, 422)


def test_verify_fake_signature_400(demo_headers, products):
    kaala = next((p for p in products if p["name"].lower() == "kaala"), None)
    o = requests.post(f"{API}/reservations/create-order", headers=demo_headers,
                     json={"product_id": kaala["id"], "qty_kg": 1}).json()
    r = requests.post(f"{API}/payments/verify", headers=demo_headers, json={
        "razorpay_order_id": o["order_id"],
        "razorpay_payment_id": "pay_FAKE0000000000",
        "razorpay_signature": "invalidsig_xxxxxxxxxxxxxxxxxxxxxx",
    })
    assert r.status_code == 400, f"expected 400 got {r.status_code} {r.text}"


def test_reservations_list_excludes_pending_advance(demo_headers):
    r = requests.get(f"{API}/reservations", headers=demo_headers)
    assert r.status_code == 200, r.text
    rows = r.json()
    for row in rows:
        assert row["status"] != "pending_advance", f"pending_advance leaked in list: {row}"


def test_ooli_completed_reservation_present(demo_headers):
    rows = requests.get(f"{API}/reservations", headers=demo_headers).json()
    ooli = next((r for r in rows if "ooli" in r["product_name"].lower() and r["status"] == "completed"), None)
    if not ooli:
        pytest.skip(f"No completed Ooli reservation seeded for demo user. Reservations: {rows}")
    assert ooli["advance_paid"] == 230, f"advance_paid={ooli['advance_paid']} expected 230"
    assert ooli["total"] == 920, f"total={ooli['total']} expected 920"


def test_ooli_booking_in_orders(demo_headers):
    rows = requests.get(f"{API}/bookings", headers=demo_headers).json()
    ooli_orders = [b for b in rows if "ooli" in (b.get("product_name", "").lower())]
    if not ooli_orders:
        pytest.skip(f"No Ooli booking present. Bookings: {rows}")
    # The order may have been advanced by admin workflow (confirmed -> ready/delivered),
    # so accept any active status; the invariant is the ₹920 order exists.
    match = [b for b in ooli_orders if b.get("amount") == 920 and b.get("status") in ("confirmed", "ready", "delivered")]
    assert match, f"No Ooli order with total=920 active. Ooli orders: {ooli_orders}"


def test_complete_order_rejects_completed_reservation(demo_headers):
    rows = requests.get(f"{API}/reservations", headers=demo_headers).json()
    completed = next((r for r in rows if r["status"] == "completed"), None)
    if not completed:
        pytest.skip("No completed reservation to test complete-order rejection on")
    r = requests.post(f"{API}/reservations/{completed['id']}/complete-order", headers=demo_headers,
                     json={"pickup_date": "2026-02-15"})
    # status != 'arrived' -> 400 with "not landed yet"
    assert r.status_code == 400, f"expected 400 got {r.status_code} {r.text}"
    assert "landed" in r.text.lower() or "arrived" in r.text.lower()


# ---------- Admin arrival trigger regression ----------
def test_admin_toggle_no_reserved_no_error(admin_headers, products):
    """Toggling any published product available False->True must not error even when no reserved reservations exist."""
    # Pick any published product (available=True), toggle to draft then back to published
    pub = next((p for p in products if p.get("available")), None)
    assert pub, "no published product to toggle"
    payload = {
        "name": pub["name"], "tamil_name": pub.get("tamil_name", ""),
        "price_per_kg": pub["price_per_kg"], "image": pub.get("image", ""),
        "origin": pub.get("origin", ""), "story": pub.get("story", ""),
        "handling": pub.get("handling", ""), "available": False,
    }
    r1 = requests.put(f"{API}/admin/products/{pub['id']}", headers=admin_headers, json=payload)
    assert r1.status_code == 200, r1.text
    # now flip back to available=True — triggers notify_catch_arrived which should be a no-op
    payload["available"] = True
    r2 = requests.put(f"{API}/admin/products/{pub['id']}", headers=admin_headers, json=payload)
    assert r2.status_code == 200, r2.text
    assert r2.json()["available"] is True


# ---------- Kudam deposit create-order regression ----------
def test_kudam_deposit_create_order(demo_headers):
    kudams = requests.get(f"{API}/kudams", headers=demo_headers).json()
    assert kudams
    r = requests.post(f"{API}/payments/create-order", headers=demo_headers,
                     json={"purpose": "deposit", "amount": 25, "kudam_id": kudams[0]["id"]})
    assert r.status_code == 200
    assert r.json()["amount"] == 2500
