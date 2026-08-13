from dotenv import load_dotenv
load_dotenv()

import os
import jwt
import bcrypt
import razorpay
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Annotated
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, BeforeValidator

mongo_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = mongo_client[os.environ["DB_NAME"]]

rzp = razorpay.Client(auth=(os.environ["RAZORPAY_KEY_ID"], os.environ["RAZORPAY_KEY_SECRET"]))

JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]

app = FastAPI(title="Meenamma API")
api = APIRouter(prefix="/api")

PyObjectId = Annotated[str, BeforeValidator(str)]


def now_utc():
    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": now_utc() + timedelta(minutes=60), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": now_utc() + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=604800, path="/")


def user_public(doc: dict) -> dict:
    return {"id": str(doc["_id"]), "email": doc["email"], "name": doc.get("name", ""), "role": doc.get("role", "user")}


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ---------- Models ----------
class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class KudamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    goal_amount: int = Field(gt=0)  # rupees


class OrderCreate(BaseModel):
    purpose: str  # "deposit" | "booking"
    amount: int = Field(gt=0)  # rupees
    kudam_id: Optional[str] = None
    product_id: Optional[str] = None
    qty_kg: Optional[float] = None
    pickup_date: Optional[str] = None


class VerifyIn(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


# ---------- Auth ----------
async def check_lockout(identifier: str):
    rec = await db.login_attempts.find_one({"identifier": identifier})
    if rec and rec.get("count", 0) >= 5:
        locked_at = rec.get("last_attempt")
        if locked_at and (now_utc() - locked_at.replace(tzinfo=timezone.utc)) < timedelta(minutes=15):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
        await db.login_attempts.delete_one({"identifier": identifier})


@api.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    doc = {"email": email, "name": body.name, "password_hash": hash_password(body.password),
           "role": "user", "created_at": now_utc()}
    res = await db.users.insert_one(doc)
    uid = str(res.inserted_id)
    set_auth_cookies(response, create_access_token(uid, email), create_refresh_token(uid))
    doc["_id"] = res.inserted_id
    return user_public(doc)


def client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for", "")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@api.post("/auth/login")
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.lower()
    identifier = f"{client_ip(request)}:{email}"
    await check_lockout(identifier)
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"last_attempt": now_utc()}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    uid = str(user["_id"])
    set_auth_cookies(response, create_access_token(uid, email), create_refresh_token(uid))
    return user_public(user)


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/", secure=True, samesite="none")
    response.delete_cookie("refresh_token", path="/", secure=True, samesite="none")
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user_public(user)


@api.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        response.set_cookie("access_token", create_access_token(str(user["_id"]), user["email"]),
                            httponly=True, secure=True, samesite="none", max_age=3600, path="/")
        return user_public(user)
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


# ---------- Kudams (savings cycles) ----------
def kudam_out(d: dict) -> dict:
    return {"id": str(d["_id"]), "name": d["name"], "goal_amount": d["goal_amount"],
            "saved_amount": d.get("saved_amount", 0), "status": d.get("status", "active"),
            "created_at": d["created_at"].isoformat()}


@api.get("/kudams")
async def list_kudams(user: dict = Depends(get_current_user)):
    docs = await db.kudams.find({"user_id": str(user["_id"])}).sort("created_at", -1).to_list(100)
    return [kudam_out(d) for d in docs]


@api.post("/kudams")
async def create_kudam(body: KudamCreate, user: dict = Depends(get_current_user)):
    doc = {"user_id": str(user["_id"]), "name": body.name, "goal_amount": body.goal_amount,
           "saved_amount": 0, "status": "active", "created_at": now_utc()}
    res = await db.kudams.insert_one(doc)
    doc["_id"] = res.inserted_id
    return kudam_out(doc)


@api.get("/kudams/{kudam_id}/deposits")
async def kudam_deposits(kudam_id: str, user: dict = Depends(get_current_user)):
    docs = await db.deposits.find({"kudam_id": kudam_id, "user_id": str(user["_id"])}).sort("created_at", -1).to_list(200)
    return [{"id": str(d["_id"]), "amount": d["amount"], "created_at": d["created_at"].isoformat()} for d in docs]


# ---------- Products ----------
def product_out(d: dict) -> dict:
    return {"id": str(d["_id"]), "name": d["name"], "tamil_name": d["tamil_name"],
            "price_per_kg": d["price_per_kg"], "image": d["image"], "origin": d["origin"],
            "story": d["story"], "handling": d["handling"], "available": d.get("available", True)}


@api.get("/products")
async def list_products():
    docs = await db.products.find({}).to_list(50)
    return [product_out(d) for d in docs]


# ---------- Bookings ----------
def booking_out(d: dict) -> dict:
    return {"id": str(d["_id"]), "product_name": d["product_name"], "qty_kg": d["qty_kg"],
            "amount": d["amount"], "pickup_date": d["pickup_date"], "status": d["status"],
            "created_at": d["created_at"].isoformat()}


@api.get("/bookings")
async def list_bookings(user: dict = Depends(get_current_user)):
    docs = await db.bookings.find({"user_id": str(user["_id"])}).sort("created_at", -1).to_list(100)
    return [booking_out(d) for d in docs]


# ---------- Payments (Razorpay) ----------
@api.post("/payments/create-order")
async def create_order(body: OrderCreate, user: dict = Depends(get_current_user)):
    if body.purpose not in ("deposit", "booking"):
        raise HTTPException(status_code=400, detail="Invalid purpose")
    if body.purpose == "deposit":
        if not body.kudam_id:
            raise HTTPException(status_code=400, detail="kudam_id required")
        kudam = await db.kudams.find_one({"_id": ObjectId(body.kudam_id), "user_id": str(user["_id"])})
        if not kudam:
            raise HTTPException(status_code=404, detail="Kudam not found")
    product = None
    if body.purpose == "booking":
        if not body.product_id or not body.qty_kg or not body.pickup_date:
            raise HTTPException(status_code=400, detail="product_id, qty_kg and pickup_date required")
        product = await db.products.find_one({"_id": ObjectId(body.product_id)})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
    amount_paise = body.amount * 100
    try:
        rzp_order = rzp.order.create({"amount": amount_paise, "currency": "INR", "payment_capture": 1})
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Razorpay order failed: {e}")
    await db.transactions.insert_one({
        "order_id": rzp_order["id"], "user_id": str(user["_id"]), "purpose": body.purpose,
        "amount": body.amount, "status": "created", "kudam_id": body.kudam_id,
        "product_id": body.product_id, "qty_kg": body.qty_kg, "pickup_date": body.pickup_date,
        "product_name": product["name"] if product else None, "created_at": now_utc(),
    })
    return {"order_id": rzp_order["id"], "amount": amount_paise, "currency": "INR",
            "key_id": os.environ["RAZORPAY_KEY_ID"]}


@api.post("/payments/verify")
async def verify_payment(body: VerifyIn, user: dict = Depends(get_current_user)):
    txn = await db.transactions.find_one({"order_id": body.razorpay_order_id, "user_id": str(user["_id"])})
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if txn["status"] == "paid":
        return {"ok": True, "already_processed": True}
    try:
        rzp.utility.verify_payment_signature({
            "razorpay_order_id": body.razorpay_order_id,
            "razorpay_payment_id": body.razorpay_payment_id,
            "razorpay_signature": body.razorpay_signature,
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Payment signature verification failed")
    await db.transactions.update_one({"_id": txn["_id"]}, {"$set": {"status": "paid", "payment_id": body.razorpay_payment_id, "paid_at": now_utc()}})
    result = {"ok": True, "purpose": txn["purpose"]}
    if txn["purpose"] == "deposit":
        await db.deposits.insert_one({"kudam_id": txn["kudam_id"], "user_id": str(user["_id"]),
                                      "amount": txn["amount"], "payment_id": body.razorpay_payment_id,
                                      "created_at": now_utc()})
        await db.kudams.update_one({"_id": ObjectId(txn["kudam_id"])}, {"$inc": {"saved_amount": txn["amount"]}})
        kudam = await db.kudams.find_one({"_id": ObjectId(txn["kudam_id"])})
        if kudam["saved_amount"] >= kudam["goal_amount"] and kudam.get("status") != "complete":
            await db.kudams.update_one({"_id": kudam["_id"]}, {"$set": {"status": "complete"}})
        result["kudam"] = kudam_out(await db.kudams.find_one({"_id": ObjectId(txn["kudam_id"])}))
    else:
        doc = {"user_id": str(user["_id"]), "product_id": txn["product_id"], "product_name": txn["product_name"],
               "qty_kg": txn["qty_kg"], "amount": txn["amount"], "pickup_date": txn["pickup_date"],
               "status": "confirmed", "payment_id": body.razorpay_payment_id, "created_at": now_utc()}
        res = await db.bookings.insert_one(doc)
        doc["_id"] = res.inserted_id
        result["booking"] = booking_out(doc)
    return result


# ---------- Admin ----------
async def get_admin_user(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


class ProductIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    tamil_name: str = ""
    price_per_kg: int = Field(gt=0)
    image: str = ""
    origin: str = ""
    story: str = ""
    handling: str = ""
    available: bool = True


class BookingStatusIn(BaseModel):
    status: str


@api.get("/admin/stats")
async def admin_stats(admin: dict = Depends(get_admin_user)):
    users = await db.users.count_documents({"role": {"$ne": "admin"}})
    bookings = await db.bookings.count_documents({})
    revenue = 0
    async for b in db.bookings.find({}, {"amount": 1}):
        revenue += b.get("amount", 0)
    saved = 0
    async for k in db.kudams.find({}, {"saved_amount": 1}):
        saved += k.get("saved_amount", 0)
    products = await db.products.count_documents({})
    return {"users": users, "bookings": bookings, "booking_revenue": revenue,
            "total_saved": saved, "products": products}


@api.post("/admin/products")
async def admin_create_product(body: ProductIn, admin: dict = Depends(get_admin_user)):
    doc = {**body.model_dump(), "created_at": now_utc()}
    res = await db.products.insert_one(doc)
    doc["_id"] = res.inserted_id
    return product_out(doc)


@api.put("/admin/products/{product_id}")
async def admin_update_product(product_id: str, body: ProductIn, admin: dict = Depends(get_admin_user)):
    res = await db.products.update_one({"_id": ObjectId(product_id)}, {"$set": body.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_out(await db.products.find_one({"_id": ObjectId(product_id)}))


@api.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, admin: dict = Depends(get_admin_user)):
    res = await db.products.delete_one({"_id": ObjectId(product_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}


async def user_email_map(user_ids: list) -> dict:
    ids = [ObjectId(u) for u in set(user_ids) if u]
    users = await db.users.find({"_id": {"$in": ids}}, {"email": 1, "name": 1}).to_list(1000)
    return {str(u["_id"]): {"email": u["email"], "name": u.get("name", "")} for u in users}


@api.get("/admin/bookings")
async def admin_bookings(admin: dict = Depends(get_admin_user)):
    docs = await db.bookings.find({}).sort("created_at", -1).to_list(500)
    umap = await user_email_map([d["user_id"] for d in docs])
    out = []
    for d in docs:
        b = booking_out(d)
        b["user"] = umap.get(d["user_id"], {})
        out.append(b)
    return out


@api.patch("/admin/bookings/{booking_id}/status")
async def admin_update_booking(booking_id: str, body: BookingStatusIn, admin: dict = Depends(get_admin_user)):
    if body.status not in ("confirmed", "ready", "collected", "cancelled"):
        raise HTTPException(status_code=400, detail="Invalid status")
    res = await db.bookings.update_one({"_id": ObjectId(booking_id)}, {"$set": {"status": body.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking_out(await db.bookings.find_one({"_id": ObjectId(booking_id)}))


@api.get("/admin/kudams")
async def admin_kudams(admin: dict = Depends(get_admin_user)):
    docs = await db.kudams.find({}).sort("created_at", -1).to_list(500)
    umap = await user_email_map([d["user_id"] for d in docs])
    out = []
    for d in docs:
        k = kudam_out(d)
        k["user"] = umap.get(d["user_id"], {})
        out.append(k)
    return out


@api.get("/admin/users")
async def admin_users(admin: dict = Depends(get_admin_user)):
    docs = await db.users.find({}, {"password_hash": 0}).sort("created_at", -1).to_list(500)
    out = []
    for u in docs:
        uid = str(u["_id"])
        out.append({"id": uid, "email": u["email"], "name": u.get("name", ""),
                    "role": u.get("role", "user"),
                    "created_at": u["created_at"].isoformat() if u.get("created_at") else None,
                    "kudam_count": await db.kudams.count_documents({"user_id": uid}),
                    "booking_count": await db.bookings.count_documents({"user_id": uid})})
    return out


# ---------- Seeding ----------
PRODUCTS = [
    {"name": "Vanjaram", "tamil_name": "வஞ்சரம்", "price_per_kg": 1100,
     "image": "https://images.unsplash.com/photo-1611214774777-3d997a9d0e35?w=800&q=80",
     "origin": "Kasimedu Harbour, Chennai",
     "story": "Line-caught at dawn by the Karuppan family, third-generation fishers of Kasimedu. The seer fish is the king of Tamil feasts.",
     "handling": "Iced within 20 minutes of catch. Never frozen."},
    {"name": "Sankara", "tamil_name": "சங்கரா", "price_per_kg": 480,
     "image": "https://images.unsplash.com/photo-1566575071977-42fab7fae5c8?w=800&q=80",
     "origin": "Nagapattinam Coast",
     "story": "Red snapper hauled from the reef beds of Nagapattinam, where the Cauvery meets the Bay of Bengal.",
     "handling": "Sorted by hand, gill-checked for freshness."},
    {"name": "Vaaval", "tamil_name": "வாவல்", "price_per_kg": 850,
     "image": "https://images.unsplash.com/photo-1572123866325-6f15f82c993d?w=800&q=80",
     "origin": "Rameswaram Waters",
     "story": "Silver pomfret from the sacred waters of Rameswaram, prized for Sunday kuzhambu across Tamil homes.",
     "handling": "Chilled seawater immersion, delivered same day."},
    {"name": "Iral", "tamil_name": "இறால்", "price_per_kg": 650,
     "image": "https://images.unsplash.com/photo-1578069744397-2f3942a02a7b?w=800&q=80",
     "origin": "Pulicat Lake",
     "story": "Tiger prawns from the brackish lagoons of Pulicat, netted by hand the way it has been done for 400 years.",
     "handling": "Live-sorted, heads intact, flash-iced."},
    {"name": "Nethili", "tamil_name": "நெத்திலி", "price_per_kg": 320,
     "image": "https://images.unsplash.com/photo-1634932515818-7f9292c4e149?w=800&q=80",
     "origin": "Kanyakumari Shore",
     "story": "Anchovies scooped from moonlit shore-seines at Kanyakumari, where three oceans meet.",
     "handling": "Sun-shade dried option available on request."},
    {"name": "Kanava", "tamil_name": "கணவா", "price_per_kg": 550,
     "image": "https://images.unsplash.com/photo-1703756292793-287f082d3a45?w=800&q=80",
     "origin": "Tuticorin Pearl Coast",
     "story": "Squid jigged at night off the pearl coast of Tuticorin, tender enough for the softest thokku.",
     "handling": "Cleaned on request, ink sacs preserved."},
]


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.kudams.create_index("user_id")
    await db.transactions.create_index("order_id")
    admin_email = os.environ["ADMIN_EMAIL"]
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({"email": admin_email, "password_hash": hash_password(admin_password),
                                   "name": "Meenamma Admin", "role": "admin", "created_at": now_utc()})
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
    if await db.products.count_documents({}) == 0:
        for p in PRODUCTS:
            await db.products.insert_one({**p, "available": True, "created_at": now_utc()})


@api.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
