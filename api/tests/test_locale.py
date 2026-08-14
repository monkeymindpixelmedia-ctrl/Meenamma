"""Tamil/English toggle tests (T5 — locale + display_ta).

Covers: profile locale persistence via PATCH /me, /auth/me exposing locale,
the /products?lang=ta catalogue serving display_ta content, and the booking
item snapshot honouring the user's locale. The demo profile's locale is
always restored to 'en' after each test.
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


def _login(email, password):
    r = requests.post(f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
                      headers={"apikey": SUPABASE_ANON, "Content-Type": "application/json"},
                      json={"email": email, "password": password}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def demo_headers():
    return {"Authorization": f"Bearer {_login(DEMO_EMAIL, DEMO_PASSWORD)}"}


def rzp_signature(order_id, payment_id):
    return hmac.new(RAZORPAY_SECRET.encode(),
                    f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()


def _set_locale(demo_headers, lang):
    r = requests.patch(f"{API}/me", headers=demo_headers, json={"locale": lang})
    assert r.status_code == 200, r.text
    return r.json()


def test_products_lang_ta_serves_tamil(demo_headers):
    en = requests.get(f"{API}/products?lang=en").json()
    ta = requests.get(f"{API}/products?lang=ta").json()
    assert en and ta, "expected products in both languages"
    assert len(en) == len(ta)
    assert all(p.get("name") for p in ta), "ta products must have names"
    assert all(p.get("tamil_name") for p in en), "en products must carry tamil_name"


def test_products_invalid_lang_400(demo_headers):
    r = requests.get(f"{API}/products?lang=fr")
    assert r.status_code == 400, r.text
    assert "lang" in r.text


def test_auth_me_includes_locale(demo_headers):
    r = requests.get(f"{API}/auth/me", headers=demo_headers)
    assert r.status_code == 200, r.text
    assert "locale" in r.json()
    assert r.json()["locale"] in ("en", "ta")


def test_set_locale_persists_and_resets(demo_headers):
    me = _set_locale(demo_headers, "ta")
    assert me["locale"] == "ta"
    me = _set_locale(demo_headers, "en")
    assert me["locale"] == "en"


def test_invalid_locale_400(demo_headers):
    r = requests.patch(f"{API}/me", headers=demo_headers, json={"locale": "fr"})
    assert r.status_code == 400, r.text


def test_booking_snapshot_localized(demo_headers):
    _set_locale(demo_headers, "ta")
    try:
        ta_products = requests.get(f"{API}/products?lang=ta").json()
        prod = next((p for p in ta_products if p.get("available")), ta_products[0])
        assert prod.get("name"), "ta product name should be populated"
        o = requests.post(f"{API}/payments/create-order", headers=demo_headers,
                          json={"purpose": "booking", "product_id": prod["id"],
                                "qty_kg": 0.5, "pickup_date": "2026-09-06"})
        assert o.status_code == 200, o.text
        rzp_id = o.json()["order_id"]
        pay_id = "pay_TEST" + os.urandom(4).hex()
        v = requests.post(f"{API}/payments/verify", headers=demo_headers, json={
            "razorpay_order_id": rzp_id, "razorpay_payment_id": pay_id,
            "razorpay_signature": rzp_signature(rzp_id, pay_id),
        })
        assert v.status_code == 200, v.text
        booking = v.json().get("booking", {})
        assert booking.get("product_name") == prod["name"], \
            f"snapshot should use the tamil name: {booking.get('product_name')} != {prod['name']}"
    finally:
        _set_locale(demo_headers, "en")
