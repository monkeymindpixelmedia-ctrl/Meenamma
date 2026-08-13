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


def test_create_booking_order_server_side_amount(new_user_session):
    """Booking amount is computed server-side from product price * qty (client 'amount' ignored)."""
    products = requests.get(f"{API}/products").json()
    prod = products[0]  # Vanjaram, 1100/kg
    r = new_user_session.post(f"{API}/payments/create-order", json={
        "purpose": "booking",
        "product_id": prod["id"],
        "qty_kg": 0.5,
        "pickup_date": "2026-02-01",
        # NB: no "amount" — must be computed
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["order_id"].startswith("order_")
    expected = max(1, round(prod["price_per_kg"] * 0.5)) * 100
    assert data["amount"] == expected, f"expected {expected} paise, got {data['amount']}"
    assert data.get("discount_percent", 0) == 0


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


# ---------- New feature tests (revision) ----------

def test_register_with_daily_plan_and_me_returns_plan():
    email = f"plan_{uuid.uuid4().hex[:8]}@example.com"
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={"name": "Plan U", "email": email, "password": "TestPass123!", "daily_plan": 10})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["daily_plan"] == 10
    me = s.get(f"{API}/auth/me").json()
    assert me["daily_plan"] == 10


def test_register_daily_plan_default_5():
    email = f"plandef_{uuid.uuid4().hex[:8]}@example.com"
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={"name": "D", "email": email, "password": "TestPass123!"})
    assert r.status_code == 200
    assert r.json()["daily_plan"] == 5


def test_register_invalid_plan_falls_back_to_5():
    email = f"planbad_{uuid.uuid4().hex[:8]}@example.com"
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={"name": "D", "email": email, "password": "TestPass123!", "daily_plan": 99})
    assert r.status_code == 200
    assert r.json()["daily_plan"] == 5


def test_rewards_status_default_zero(new_user_session):
    r = new_user_session.get(f"{API}/rewards/status")
    assert r.status_code == 200
    assert r.json()["discount_percent"] == 0


def test_rewards_status_and_discounted_booking_after_complete_kudam():
    """Register a user, create a kudam, mark it complete in mongo, then verify discount applies."""
    import motor.motor_asyncio, asyncio
    from bson import ObjectId as OID

    email = f"reward_{uuid.uuid4().hex[:8]}@example.com"
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={"name": "Reward U", "email": email, "password": "TestPass123!"})
    assert r.status_code == 200
    kr = s.post(f"{API}/kudams", json={"name": "Feast Kudam", "goal_amount": 1000})
    assert kr.status_code == 200
    kid = kr.json()["id"]

    # Directly mark the kudam complete via mongo
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "meenamma")

    async def mark():
        cli = motor.motor_asyncio.AsyncIOMotorClient(mongo_url)
        db = cli[db_name]
        res = await db.kudams.update_one({"_id": OID(kid)}, {"$set": {"status": "complete"}})
        cli.close()
        return res.modified_count

    modified = asyncio.get_event_loop().run_until_complete(mark()) if False else asyncio.new_event_loop().run_until_complete(mark())
    assert modified == 1

    # rewards/status should now say 20%
    rs = s.get(f"{API}/rewards/status").json()
    assert rs["discount_percent"] == 20, rs
    assert rs["kudam_id"] == kid

    # Booking should be discounted 20%
    products = requests.get(f"{API}/products").json()
    prod = products[0]
    r = s.post(f"{API}/payments/create-order", json={
        "purpose": "booking", "product_id": prod["id"], "qty_kg": 1.0, "pickup_date": "2026-03-01"
    })
    assert r.status_code == 200, r.text
    data = r.json()
    expected = max(1, round(prod["price_per_kg"] * 1.0 * 0.8)) * 100
    assert data["amount"] == expected, f"expected {expected} paise, got {data['amount']}"
    assert data["discount_percent"] == 20


def test_admin_upload_image(admin_session, tmp_path):
    import io
    # 1x1 transparent PNG
    png = bytes.fromhex("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c62000100000005000104ea0f5fd80000000049454e44ae426082")
    files = {"file": ("test.png", io.BytesIO(png), "image/png")}
    r = admin_session.post(f"{API}/admin/upload", files=files)
    assert r.status_code == 200, r.text
    url = r.json()["url"]
    assert url.startswith("/api/uploads/")
    # GET the file
    r2 = requests.get(f"{BASE_URL}{url}")
    assert r2.status_code == 200
    assert r2.content == png


def test_admin_upload_rejects_txt(admin_session):
    import io
    files = {"file": ("bad.txt", io.BytesIO(b"hello"), "text/plain")}
    r = admin_session.post(f"{API}/admin/upload", files=files)
    assert r.status_code == 400


def test_admin_upload_unauthenticated():
    import io
    png = bytes.fromhex("89504e470d0a1a0a")
    files = {"file": ("t.png", io.BytesIO(png), "image/png")}
    r = requests.post(f"{API}/admin/upload", files=files)
    assert r.status_code in (401, 403)


def test_admin_upload_non_admin_forbidden(new_user_session):
    import io
    png = bytes.fromhex("89504e470d0a1a0a")
    files = {"file": ("t.png", io.BytesIO(png), "image/png")}
    r = new_user_session.post(f"{API}/admin/upload", files=files)
    assert r.status_code == 403


# ---------- Iteration-3 feature tests ----------
def test_register_accepts_pincode_and_upi():
    email = f"pin_{uuid.uuid4().hex[:8]}@example.com"
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={
        "name": "P U", "email": email, "password": "TestPass123!",
        "pincode": "600001", "upi_id": "pin@upi", "daily_plan": 10
    })
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["pincode"] == "600001"
    assert body["upi_id"] == "pin@upi"
    assert body["daily_plan"] == 10
    me = s.get(f"{API}/auth/me").json()
    assert me["pincode"] == "600001"
    assert me["upi_id"] == "pin@upi"


def test_patch_me_updates_fields():
    email = f"patch_{uuid.uuid4().hex[:8]}@example.com"
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={"name": "Old", "email": email, "password": "TestPass123!"})
    assert r.status_code == 200
    r = s.patch(f"{API}/me", json={"name": "New Name", "daily_plan": 10, "pincode": "560001", "upi_id": "new@upi"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["name"] == "New Name"
    assert body["daily_plan"] == 10
    assert body["pincode"] == "560001"
    assert body["upi_id"] == "new@upi"
    # persistence
    me = s.get(f"{API}/auth/me").json()
    assert me["name"] == "New Name"
    assert me["daily_plan"] == 10


def test_patch_me_invalid_plan_ignored():
    email = f"patchbad_{uuid.uuid4().hex[:8]}@example.com"
    s = requests.Session()
    s.post(f"{API}/auth/register", json={"name": "X", "email": email, "password": "TestPass123!"})
    r = s.patch(f"{API}/me", json={"daily_plan": 7})
    assert r.status_code == 200
    assert r.json()["daily_plan"] == 5  # unchanged default


def test_patch_me_unauthenticated():
    r = requests.patch(f"{API}/me", json={"name": "X"})
    assert r.status_code == 401


def test_demo_user_login_and_seeded_kudam():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": "demo@meenamma.in", "password": "meenamma2026"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["email"] == "demo@meenamma.in"
    assert body["name"] == "Demo Family"
    kr = s.get(f"{API}/kudams")
    assert kr.status_code == 200
    kudams = kr.json()
    sunday = next((k for k in kudams if k["name"] == "Sunday Feast"), None)
    assert sunday is not None, f"Sunday Feast kudam missing: {kudams}"
    assert sunday["goal_amount"] == 500
    assert sunday["saved_amount"] == 330
    # cleanup: reset daily_plan to 5 in case previous tests touched it
    s.patch(f"{API}/me", json={"daily_plan": 5})
