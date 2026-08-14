"""Notification worker + outbox tests (T1 — real email alerts).

Live integration: local FastAPI + real Supabase. A real (test-key) booking is
paid with a locally computed Razorpay signature so the confirm path runs, then
the outbox rows are asserted and drained via the admin endpoints.
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


def _outbox(admin_headers):
    r = requests.get(f"{API}/admin/notifications", headers=admin_headers)
    assert r.status_code == 200
    return r.json()


# ---------- Template rendering (unit) ----------
def test_render_email_templates():
    from api.notify import render_email
    subj, html = render_email("booking_confirmed", {
        "name": "Amma", "product": "Vanjaram", "amount": 920,
        "date": "2026-09-01", "slot": "7:00 AM",
    })
    assert subj == "Your catch is confirmed"
    assert "Amma" in html and "Vanjaram" in html
    assert "920" in html and "7:00 AM" in html
    for key, expected in (("catch_arrived", "has landed"),
                          ("booking_ready", "is ready"),
                          ("booking_delivered", "delivered")):
        s, h = render_email(key, {"name": "Amma", "product": "Vanjaram"})
        assert "Vanjaram" in h, key
        assert expected in h, key
    # an unknown event key still renders (generic fallback)
    _, h = render_email("something_new", {"name": "Amma"})
    assert "Amma" in h


# ---------- Auth guards ----------
def test_process_requires_admin(demo_headers):
    r = requests.get(f"{API}/notifications/process", headers=demo_headers)
    assert r.status_code == 403


def test_admin_notifications_requires_admin(demo_headers):
    r = requests.get(f"{API}/admin/notifications", headers=demo_headers)
    assert r.status_code == 403


def test_process_admin_ok(admin_headers):
    r = requests.get(f"{API}/notifications/process", headers=admin_headers)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["ok"] is True
    assert "sent" in j and "failed" in j


# ---------- Booking lifecycle queues outbox rows ----------
def test_booking_verify_queues_confirmed_and_ready_delivered(admin_headers, demo_headers):
    prods = requests.get(f"{API}/products").json()
    prod = next((p for p in prods if p.get("available")), prods[0])
    o = requests.post(f"{API}/payments/create-order", headers=demo_headers, json={
        "purpose": "booking", "product_id": prod["id"], "qty_kg": 0.5,
        "pickup_date": "2026-09-01",
    })
    assert o.status_code == 200, o.text
    rzp_order_id = o.json()["order_id"]
    pay_id = "pay_TEST" + os.urandom(4).hex()
    v = requests.post(f"{API}/payments/verify", headers=demo_headers, json={
        "razorpay_order_id": rzp_order_id, "razorpay_payment_id": pay_id,
        "razorpay_signature": rzp_signature(rzp_order_id, pay_id),
    })
    assert v.status_code == 200, v.text
    bid = v.json()["booking"]["id"]

    rows = _outbox(admin_headers)
    confirmed = [r for r in rows if r["idempotency_key"] == f"booking:{bid}:booking_confirmed"]
    assert confirmed, f"booking_confirmed row missing; recent keys: {[r['idempotency_key'] for r in rows[:10]]}"
    assert (confirmed[0].get("payload") or {}).get("product") == prod["name"]
    assert (confirmed[0].get("payload") or {}).get("email") == DEMO_EMAIL

    # drain without RESEND_API_KEY leaves the row queued (outbox is source of truth)
    pr = requests.get(f"{API}/notifications/process", headers=admin_headers)
    assert pr.status_code == 200, pr.text
    rows2 = _outbox(admin_headers)
    still = [r for r in rows2 if r["idempotency_key"] == f"booking:{bid}:booking_confirmed"]
    assert still and still[0]["processed_at"] is None

    # admin moves the order through ready -> delivered, each queues an event
    for st in ("ready", "delivered"):
        r = requests.patch(f"{API}/admin/bookings/{bid}/status",
                           headers=admin_headers, json={"status": st})
        assert r.status_code == 200, r.text
    rows3 = _outbox(admin_headers)
    for ev in ("booking_ready", "booking_delivered"):
        assert any(x["idempotency_key"] == f"booking:{bid}:{ev}" for x in rows3), \
            f"missing {ev}; keys: {[x['idempotency_key'] for x in rows3[:10]]}"

