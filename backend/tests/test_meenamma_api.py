"""Meenamma backend API tests"""
import os
import time
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://a4c6ee18-ed78-48cf-b539-e32fe98e5224.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@meenamma.in"
ADMIN_PASSWORD = "TempleGold@2026"


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def new_user_session():
    s = requests.Session()
    email = f"test_{uuid.uuid4().hex[:10]}@example.com"
    r = s.post(f"{API}/auth/register", json={"name": "Test User", "email": email, "password": "TestPass123!"})
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    s.email = email
    return s


# ---------- Health ----------
def test_health():
    r = requests.get(f"{API}/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ---------- Auth ----------
def test_register_returns_user_and_cookies(new_user_session):
    # already registered in fixture
    assert "access_token" in new_user_session.cookies
    assert "refresh_token" in new_user_session.cookies
    r = new_user_session.get(f"{API}/auth/me")
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == new_user_session.email
    assert data["role"] == "user"
    assert "id" in data


def test_register_duplicate_email(new_user_session):
    r = requests.post(f"{API}/auth/register", json={"name": "X", "email": new_user_session.email, "password": "TestPass123!"})
    assert r.status_code == 400


def test_admin_login_me_logout_refresh(admin_session):
    r = admin_session.get(f"{API}/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == ADMIN_EMAIL
    assert r.json()["role"] == "admin"

    # refresh
    r = admin_session.post(f"{API}/auth/refresh")
    assert r.status_code == 200
    assert r.json()["email"] == ADMIN_EMAIL

    # logout on a separate session so we don't kill admin_session
    s2 = requests.Session()
    s2.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    r = s2.post(f"{API}/auth/logout")
    assert r.status_code == 200
    r = s2.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_brute_force_lockout():
    throwaway = f"bf_{uuid.uuid4().hex[:8]}@example.com"
    # 5 wrong attempts
    for i in range(5):
        r = requests.post(f"{API}/auth/login", json={"email": throwaway, "password": "wrong"})
        assert r.status_code == 401, f"Attempt {i+1}: {r.status_code}"
    # 6th attempt should be locked out
    r = requests.post(f"{API}/auth/login", json={"email": throwaway, "password": "wrong"})
    assert r.status_code == 429, f"Expected 429, got {r.status_code} {r.text}"


# ---------- Products ----------
def test_products_seeded():
    r = requests.get(f"{API}/products")
    assert r.status_code == 200
    products = r.json()
    assert len(products) == 6
    names = {p["name"] for p in products}
    assert names == {"Vanjaram", "Sankara", "Vaaval", "Iral", "Nethili", "Kanava"}
    for p in products:
        assert p["image"].startswith("http")
        assert p["story"]
        assert p["origin"]
        assert "id" in p


# ---------- Kudams ----------
def test_kudam_requires_auth():
    r = requests.get(f"{API}/kudams")
    assert r.status_code == 401


def test_create_and_list_kudam(new_user_session):
    r = new_user_session.post(f"{API}/kudams", json={"name": "Diwali Kudam", "goal_amount": 25000})
    assert r.status_code == 200, r.text
    kudam = r.json()
    assert kudam["name"] == "Diwali Kudam"
    assert kudam["goal_amount"] == 25000
    assert kudam["saved_amount"] == 0
    assert "id" in kudam
    new_user_session.kudam_id = kudam["id"]

    r = new_user_session.get(f"{API}/kudams")
    assert r.status_code == 200
    kudams = r.json()
    assert any(k["id"] == kudam["id"] for k in kudams)


# ---------- Payments ----------
def test_create_deposit_order(new_user_session):
    kid = getattr(new_user_session, "kudam_id", None)
    if not kid:
        r = new_user_session.post(f"{API}/kudams", json={"name": "K2", "goal_amount": 5000})
        kid = r.json()["id"]
        new_user_session.kudam_id = kid
    r = new_user_session.post(f"{API}/payments/create-order", json={
        "purpose": "deposit", "amount": 100, "kudam_id": kid
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["order_id"].startswith("order_")
    assert data["amount"] == 10000  # paise
    assert data["currency"] == "INR"
    assert data["key_id"].startswith("rzp_test_")


def test_create_booking_order(new_user_session):
    products = requests.get(f"{API}/products").json()
    pid = products[0]["id"]
    r = new_user_session.post(f"{API}/payments/create-order", json={
        "purpose": "booking", "amount": 500, "product_id": pid,
        "qty_kg": 0.5, "pickup_date": "2026-02-01"
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["order_id"].startswith("order_")
    assert data["amount"] == 50000


def test_verify_invalid_signature(new_user_session):
    # create an order first so txn exists
    kid = getattr(new_user_session, "kudam_id", None)
    r = new_user_session.post(f"{API}/payments/create-order", json={
        "purpose": "deposit", "amount": 50, "kudam_id": kid
    })
    order_id = r.json()["order_id"]
    r = new_user_session.post(f"{API}/payments/verify", json={
        "razorpay_order_id": order_id,
        "razorpay_payment_id": "pay_FAKE1234567890",
        "razorpay_signature": "invalid_sig_ffffffffffffffffffffffff",
    })
    assert r.status_code == 400


def test_create_order_bad_purpose(new_user_session):
    r = new_user_session.post(f"{API}/payments/create-order", json={
        "purpose": "invalid", "amount": 100
    })
    assert r.status_code == 400


def test_create_order_deposit_missing_kudam(new_user_session):
    r = new_user_session.post(f"{API}/payments/create-order", json={
        "purpose": "deposit", "amount": 100
    })
    assert r.status_code == 400
