"""Delivery slot picker tests (T2 — 6 AM / 7 AM booking sheet slot).

Scope note: the picker applies to the Market booking sheet (per backlog). The
off-season reservation completion keeps the existing 6:00 AM default — the
reservations table has no slot column (no DDL in this loop), so a picked slot
cannot be persisted across the two-step reservation flow.
"""
import hashlib
import hmac
import os
import requests
import pytest
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
SUPABASE_URL = os.environ["REACT_APP_SUPABASE_URL"].rstrip("/")
SUPABASE_ANON = os.environ["REACT_APP_SUPABASE_ANON_KEY"]
RAZORPAY_SECRET = os.environ["RAZORPAY_KEY_SECRET"]

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


def rzp_signature(order_id, payment_id):
    return hmac.new(RAZORPAY_SECRET.encode(),
                    f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()


def _paid_booking(demo_headers, payload):
    """Create + fully pay a booking; returns the confirmed booking dict."""
    prods = requests.get(f"{API}/products").json()
    prod = next((p for p in prods if p.get("available")), prods[0])
    o = requests.post(f"{API}/payments/create-order", headers=demo_headers,
                      json={"purpose": "booking", "product_id": prod["id"],
                            "qty_kg": 0.5, "pickup_date": "2026-09-05", **payload})
    assert o.status_code == 200, o.text
    rzp_id = o.json()["order_id"]
    pay_id = "pay_TEST" + os.urandom(4).hex()
    v = requests.post(f"{API}/payments/verify", headers=demo_headers, json={
        "razorpay_order_id": rzp_id, "razorpay_payment_id": pay_id,
        "razorpay_signature": rzp_signature(rzp_id, pay_id),
    })
    assert v.status_code == 200, v.text
    return v.json()["booking"]


def test_create_order_invalid_window_400(demo_headers):
    prods = requests.get(f"{API}/products").json()
    prod = next((p for p in prods if p.get("available")), prods[0])
    r = requests.post(f"{API}/payments/create-order", headers=demo_headers, json={
        "purpose": "booking", "product_id": prod["id"], "qty_kg": 0.5,
        "pickup_date": "2026-09-05", "delivery_window": "5:00 AM",
    })
    assert r.status_code == 400, r.text
    assert "delivery_window" in r.text


def test_booking_window_7am_persists(demo_headers):
    b = _paid_booking(demo_headers, {"delivery_window": "7:00 AM"})
    assert b["delivery_window"] == "7:00 AM"


def test_booking_window_defaults_to_6am(demo_headers):
    b = _paid_booking(demo_headers, {})
    assert b["delivery_window"] == "6:00 AM"


def test_admin_bookings_include_window(admin_headers):
    r = requests.get(f"{API}/admin/bookings", headers=admin_headers)
    assert r.status_code == 200, r.text
    bookings = r.json()
    assert bookings, "expected at least one admin booking"
    for b in bookings:
        assert "delivery_window" in b, f"delivery_window missing: {b}"
