"""Kudam balance redemption tests (T4 — redeem savings toward a booking).

A fresh kudam is consecrated and filled via the simulate-deposit endpoint, then
redeemed against a booking paid with a locally-computed Razorpay signature.
"""
import hashlib
import hmac
import os
import uuid
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


@pytest.fixture(scope="module")
def products():
    r = requests.get(f"{API}/products")
    assert r.status_code == 200
    return r.json()


def rzp_signature(order_id, payment_id):
    return hmac.new(RAZORPAY_SECRET.encode(),
                    f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()


def _new_kudam(demo_headers, goal):
    r = requests.post(f"{API}/kudams", headers=demo_headers,
                      json={"name": f"REDEEM_{uuid.uuid4().hex[:6]}", "goal_amount": goal})
    assert r.status_code == 200, r.text
    return r.json()


def _fill_kudam(demo_headers, kid, amount):
    r = requests.post(f"{API}/kudams/{kid}/simulate-deposit",
                      headers=demo_headers, json={"amount": amount})
    assert r.status_code == 200, r.text
    return r.json()["kudam"]


def _create_booking(demo_headers, prod, extra=None):
    return requests.post(f"{API}/payments/create-order", headers=demo_headers, json={
        "purpose": "booking", "product_id": prod["id"], "qty_kg": 0.5,
        "pickup_date": "2026-09-07", **(extra or {}),
    })


def test_rewards_status_includes_saved_amount(demo_headers):
    j = requests.get(f"{API}/rewards/status", headers=demo_headers).json()
    assert "saved_amount" in j, j


def test_redeem_applies_credit_and_redeems_kudam(demo_headers, products):
    k = _new_kudam(demo_headers, 100)
    filled = _fill_kudam(demo_headers, k["id"], 100)
    assert filled["status"] == "complete"

    prod = next((p for p in products if p.get("available")), products[0])
    r = _create_booking(demo_headers, prod, {"redeem_kudam_id": k["id"]})
    assert r.status_code == 200, r.text
    d = r.json()

    # a complete kudam now exists -> 20% reward discount applies
    base_amt = max(1, round(prod["price_per_kg"] * 0.5 * 0.8))
    expected_credit = min(100, base_amt) * 100
    assert d["credit_paise"] == expected_credit, d
    assert d["amount"] == max(1, base_amt - expected_credit // 100) * 100, d

    # pay it -> kudam flips to redeemed
    pay_id = "pay_RD" + os.urandom(4).hex()
    v = requests.post(f"{API}/payments/verify", headers=demo_headers, json={
        "razorpay_order_id": d["order_id"], "razorpay_payment_id": pay_id,
        "razorpay_signature": rzp_signature(d["order_id"], pay_id),
    })
    assert v.status_code == 200, v.text
    kudams = requests.get(f"{API}/kudams", headers=demo_headers).json()
    mine = next((x for x in kudams if x["id"] == k["id"]), None)
    assert mine and mine["status"] == "redeemed", f"expected redeemed, got {mine}"


def test_redeem_credit_covers_whole_order(demo_headers, products):
    k = _new_kudam(demo_headers, 500)
    _fill_kudam(demo_headers, k["id"], 500)
    prod = next((p for p in products if p.get("available") and p["price_per_kg"] <= 1000), None)
    if not prod:
        pytest.skip("no available product <= ₹1000/kg to fully cover with ₹500 kudam")
    r = _create_booking(demo_headers, prod, {"redeem_kudam_id": k["id"]})
    assert r.status_code == 200, r.text
    d = r.json()
    # the ₹500 kudam covers the whole (₹-500-max) order: payable drops to ₹1
    assert d["amount"] == 100, f"minimum ₹1 payable expected, got {d['amount']}"
    assert d["credit_paise"] > 0, d


def test_redeem_non_complete_kudam_falls_back(demo_headers, products):
    k = _new_kudam(demo_headers, 500)  # never filled -> status active
    prod = next((p for p in products if p.get("available")), products[0])
    r = _create_booking(demo_headers, prod, {"redeem_kudam_id": k["id"]})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["credit_paise"] == 0, d
    assert d["amount"] in (
        max(1, round(prod["price_per_kg"] * 0.5)) * 100,
        max(1, round(prod["price_per_kg"] * 0.5 * 0.8)) * 100,
    ), d
