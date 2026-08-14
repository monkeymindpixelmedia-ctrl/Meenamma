from dotenv import load_dotenv
load_dotenv()

import os
import re
import json
import uuid
import hashlib
import jwt as pyjwt
import razorpay
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from supertokens_python import init, InputAppInfo, SupertokensConfig
from supertokens_python.recipe import emailpassword, session
from supertokens_python.recipe.emailpassword.interfaces import APIInterface
from supertokens_python.framework.fastapi import get_middleware
from supertokens_python.recipe.session.framework.fastapi import verify_session
from supertokens_python.recipe.session import SessionContainer
from supertokens_python.recipe.emailpassword.types import EmailDeliveryOverrideInput, EmailTemplateVars
from supertokens_python.ingredients.emaildelivery.types import EmailDeliveryConfig
import resend
from pydantic import BaseModel, Field
from supabase import create_client
from api.notify import drain_notification_outbox, queue_notification

SUPABASE_URL = os.environ["SUPABASE_URL"]
sb = create_client(SUPABASE_URL, os.environ["SUPABASE_SERVICE_ROLE_KEY"])
import httpx as _httpx
_old = sb.postgrest.session
sb.postgrest.session = _httpx.Client(
    base_url=_old.base_url, headers=_old.headers, timeout=_old.timeout,
    limits=_httpx.Limits(max_connections=20, max_keepalive_connections=10, keepalive_expiry=15),
    transport=_httpx.HTTPTransport(retries=2),
)
JWKS = None
ISSUER = ""

rzp = razorpay.Client(auth=(os.environ.get("RAZORPAY_KEY_ID", ""), os.environ.get("RAZORPAY_KEY_SECRET", "")))
resend.api_key = os.environ.get("RESEND_API_KEY", "re_dummy_value")

def custom_email_deliver(original_implementation: EmailDeliveryOverrideInput) -> EmailDeliveryOverrideInput:
    original_send_email = original_implementation.send_email
    async def send_email(template_vars: EmailTemplateVars, user_context: dict):
        try:
            resend.Emails.send({
                "from": "Meenamma <onboarding@resend.dev>",
                "to": template_vars.user.email,
                "subject": "Welcome to Meenamma - The Ritual of the Sea",
                "html": "<div style='font-family: \"Cormorant Garamond\", serif; padding: 40px; text-align: center;'><h1 style='color: #1a1a1a; letter-spacing: 0.1em; text-transform: uppercase;'>The Ritual of the Sea</h1><p style='color: #4a4a4a; font-size: 16px; margin-top: 20px;'>You have successfully joined Meenamma. We are honored to serve you.</p></div>"
            })
        except Exception as e:
            print("Resend failed", e)
        return await original_send_email(template_vars, user_context)
    original_implementation.send_email = send_email
    return original_implementation

def override_emailpassword_apis(original_implementation: APIInterface):
    original_sign_up_post = original_implementation.sign_up_post
    async def sign_up_post(form_fields, tenant_id, session, api_options, user_context):
        result = await original_sign_up_post(form_fields, tenant_id, session, api_options, user_context)
        if result.status == "OK":
            user = result.user
            try:
                sb.table("profiles").insert({
                    "id": user.id,
                    "email": user.emails[0],
                    "display_name": user.emails[0].split('@')[0]
                }).execute()
            except Exception as e:
                print("Failed to sync profile to supabase:", e)
        return result
    original_implementation.sign_up_post = sign_up_post
    return original_implementation

init(
    app_info=InputAppInfo(
        app_name="Meenamma",
        api_domain="http://localhost:8000",
        website_domain="http://localhost:3000",
        api_base_path="/api/auth",
        website_base_path="/auth"
    ),
    supertokens_config=SupertokensConfig(
        connection_uri=os.environ.get("SUPERTOKENS_CONNECTION_URI", "https://try.supertokens.com"),
        api_key=os.environ.get("SUPERTOKENS_API_KEY")
    ),
    framework='fastapi',
    recipe_list=[
        session.init(),
        emailpassword.init(
            email_delivery=EmailDeliveryConfig(override=custom_email_deliver),
            override=emailpassword.InputOverrideConfig(apis=override_emailpassword_apis)
        )
    ],
    mode='asgi'
)

app = FastAPI(title="Meenamma API")
app.add_middleware(get_middleware())
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "PUT", "POST", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "supertokens-namespace"] + getattr(supertokens_python.framework.fastapi, 'get_cors_allowed_headers', lambda: ["fdi-version", "anti-csrf", "rid", "st-auth-mode"])() if hasattr(supertokens_python, 'framework') else ["Content-Type"]
)

api = APIRouter(prefix="/api")


def now_utc():
    return datetime.now(timezone.utc)


def slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "item"


# ---------- Auth ----------
def get_current_user(st_session: SessionContainer = Depends(verify_session())):
    user_id = st_session.get_user_id()
    rows = (sb.table("profiles")
            .select("*, staff_role_assignments!profile_id(role, revoked_at)")
            .eq("id", user_id).execute().data)
    if not rows:
        raise HTTPException(status_code=401, detail="Profile not found")
    p = rows[0]
    roles = [r["role"] for r in (p.get("staff_role_assignments") or []) if not r.get("revoked_at")]
    p["_role"] = "admin" if "ops_admin" in roles else "user"
    return p


def get_admin_user(user: dict = Depends(get_current_user)) -> dict:
    if user["_role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def user_public(p: dict) -> dict:
    return {"id": p["id"], "email": p.get("email") or "", "name": p.get("display_name") or "",
            "role": p.get("_role", "user"), "daily_plan": p.get("daily_plan") or 5,
            "pincode": p.get("pincode") or "", "upi_id": p.get("upi_id") or "",
            "autopay_status": p.get("autopay_status") or "none"}


@api.get("/auth/me")
def me(user: dict = Depends(get_current_user)):
    return user_public(user)


class ProfileIn(BaseModel):
    name: Optional[str] = None
    daily_plan: Optional[int] = None
    pincode: Optional[str] = None
    upi_id: Optional[str] = None


@api.patch("/me")
def update_me(body: ProfileIn, user: dict = Depends(get_current_user)):
    upd = {}
    if body.name:
        upd["display_name"] = body.name
    if body.daily_plan in (1, 5, 10):
        upd["daily_plan"] = body.daily_plan
    if body.pincode is not None:
        upd["pincode"] = body.pincode
    if body.upi_id is not None:
        upd["upi_id"] = body.upi_id
    if upd:
        sb.table("profiles").update(upd).eq("id", user["id"]).execute()
        user = {**user, **upd}
    return user_public(user)


# ---------- Kudams ----------
def kudam_out(d: dict) -> dict:
    return {"id": d["id"], "name": d["name"], "goal_amount": round(d["goal_paise"] / 100),
            "saved_amount": round(d["saved_paise"] / 100), "status": d["status"],
            "created_at": d["created_at"]}


class KudamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    goal_amount: int = Field(gt=0)


@api.get("/kudams")
def list_kudams(user: dict = Depends(get_current_user)):
    rows = (sb.table("kudams").select("*").eq("profile_id", user["id"])
            .order("created_at", desc=True).execute().data)
    return [kudam_out(d) for d in rows]


@api.post("/kudams")
def create_kudam(body: KudamCreate, user: dict = Depends(get_current_user)):
    d = sb.table("kudams").insert({"profile_id": user["id"], "name": body.name,
                                   "goal_paise": body.goal_amount * 100}).execute().data[0]
    return kudam_out(d)


@api.get("/kudams/{kudam_id}/deposits")
def kudam_deposits(kudam_id: str, user: dict = Depends(get_current_user)):
    rows = (sb.table("kudam_deposits").select("*").eq("kudam_id", kudam_id)
            .eq("profile_id", user["id"]).order("created_at", desc=True).execute().data)
    return [{"id": d["id"], "amount": round(d["amount_paise"] / 100), "created_at": d["created_at"]} for d in rows]


def apply_kudam_deposit(kudam_id: str, amount_paise: int, source: str, payment_id: Optional[str] = None) -> dict:
    k = sb.table("kudams").select("*").eq("id", kudam_id).execute().data[0]
    sb.table("kudam_deposits").insert({
        "kudam_id": kudam_id, "profile_id": k["profile_id"], "amount_paise": amount_paise,
        "source": source, "provider_payment_id": payment_id}).execute()
    new_saved = k["saved_paise"] + amount_paise
    upd = {"saved_paise": new_saved}
    if new_saved >= k["goal_paise"] and k["status"] == "active":
        upd["status"] = "complete"
    return sb.table("kudams").update(upd).eq("id", kudam_id).execute().data[0]


class SimulateIn(BaseModel):
    amount: Optional[int] = Field(default=None, gt=0)


@api.post("/kudams/{kudam_id}/simulate-deposit")
def simulate_deposit(kudam_id: str, body: SimulateIn, user: dict = Depends(get_current_user)):
    rows = sb.table("kudams").select("id").eq("id", kudam_id).eq("profile_id", user["id"]).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Kudam not found")
    amount = body.amount or user.get("daily_plan") or 5
    k = apply_kudam_deposit(kudam_id, amount * 100, "simulated")
    return {"ok": True, "kudam": kudam_out(k)}


def get_reward_kudam(profile_id: str):
    rows = (sb.table("kudams").select("*").eq("profile_id", profile_id)
            .eq("status", "complete").limit(1).execute().data)
    return rows[0] if rows else None


@api.get("/rewards/status")
def rewards_status(user: dict = Depends(get_current_user)):
    k = get_reward_kudam(user["id"])
    if k:
        return {"discount_percent": 20, "kudam_id": k["id"], "kudam_name": k["name"],
                "saved_amount": round(k["saved_paise"] / 100)}
    return {"discount_percent": 0, "saved_amount": 0}


# ---------- Products ----------
def product_out(d: dict) -> dict:
    disp = d.get("display_en") or {}
    media = d.get("media") or []
    return {"id": d["id"], "name": disp.get("name", ""), "tamil_name": disp.get("tamil_name", ""),
            "price_per_kg": round(d["base_price_paise"] / 100),
            "image": media[0].get("url", "") if media else "",
            "origin": disp.get("origin", ""), "story": disp.get("story", ""),
            "handling": disp.get("handling", ""), "available": d["status"] == "published"}


@api.get("/products")
def list_products():
    rows = (sb.table("products").select("*").neq("status", "archived")
            .order("created_at", desc=False).execute().data)
    return [product_out(d) for d in rows]


# ---------- Bookings (orders) ----------
ACTIVE_ORDER_STATUSES = ["paid", "confirmed", "packing", "ready", "out_for_delivery", "delivered", "cancelled"]


def booking_out(o: dict) -> dict:
    items = o.get("order_items") or []
    it = items[0] if items else {}
    snap = it.get("item_snapshot") or {}
    slot = o.get("delivery_slot_snapshot") or {}
    return {"id": o["id"], "product_name": snap.get("name", ""),
            "qty_kg": (it.get("net_weight_grams") or 0) / 1000,
            "amount": round(o["total_paise"] / 100),
            "pickup_date": slot.get("delivery_date", ""),
            "delivery_window": slot.get("window", ""),
            "status": o["status"],
            "discount_percent": (o.get("policy_snapshot") or {}).get("discount_percent", 0),
            "created_at": o["created_at"]}


@api.get("/bookings")
def list_bookings(user: dict = Depends(get_current_user)):
    rows = (sb.table("orders").select("*, order_items(*)").eq("profile_id", user["id"])
            .in_("status", ACTIVE_ORDER_STATUSES).order("created_at", desc=True).execute().data)
    return [booking_out(o) for o in rows]


# ---------- Payments ----------
DELIVERY_WINDOWS = ("6:00 AM", "7:00 AM")
DEFAULT_DELIVERY_WINDOW = "6:00 AM"


class OrderCreate(BaseModel):
    purpose: str
    amount: Optional[int] = Field(default=None, gt=0)
    kudam_id: Optional[str] = None
    product_id: Optional[str] = None
    qty_kg: Optional[float] = None
    pickup_date: Optional[str] = None
    delivery_window: Optional[str] = None
    redeem_kudam_id: Optional[str] = None


class VerifyIn(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@api.post("/payments/create-order")
def create_order(body: OrderCreate, user: dict = Depends(get_current_user)):
    if body.purpose not in ("deposit", "booking"):
        raise HTTPException(status_code=400, detail="Invalid purpose")
    uid = user["id"]
    discount_percent = 0
    credit_paise = 0

    if body.purpose == "deposit":
        if not body.kudam_id or not body.amount:
            raise HTTPException(status_code=400, detail="kudam_id and amount required")
        krows = sb.table("kudams").select("id").eq("id", body.kudam_id).eq("profile_id", uid).execute().data
        if not krows:
            raise HTTPException(status_code=404, detail="Kudam not found")
        amount = body.amount
        try:
            rzp_order = rzp.order.create({"amount": amount * 100, "currency": "INR", "payment_capture": 1})
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Razorpay order failed: {e}")
        sb.table("kudam_payment_attempts").insert({
            "kudam_id": body.kudam_id, "profile_id": uid,
            "razorpay_order_id": rzp_order["id"], "amount_paise": amount * 100}).execute()
    else:
        if not body.product_id or not body.qty_kg or not body.pickup_date:
            raise HTTPException(status_code=400, detail="product_id, qty_kg and pickup_date required")
        window = body.delivery_window or DEFAULT_DELIVERY_WINDOW
        if window not in DELIVERY_WINDOWS:
            raise HTTPException(status_code=400, detail="delivery_window must be 6:00 AM or 7:00 AM")
        prows = sb.table("products").select("*").eq("id", body.product_id).neq("status", "archived").execute().data
        if not prows:
            raise HTTPException(status_code=404, detail="Product not found")
        prod = prows[0]
        price_per_kg = prod["base_price_paise"] / 100
        base = price_per_kg * body.qty_kg
        reward = get_reward_kudam(uid)
        discount_kudam_id = None
        if reward:
            discount_kudam_id = reward["id"]
            discount_percent = 20
        amount = max(1, round(base * (1 - discount_percent / 100)))
        base_paise = round(base * 100)
        discount_paise = base_paise - amount * 100
        redeem_kudam_id = None
        if body.redeem_kudam_id:
            kr = sb.table("kudams").select("saved_paise").eq("id", body.redeem_kudam_id) \
                .eq("profile_id", uid).eq("status", "complete").execute().data
            if kr:
                redeem_kudam_id = body.redeem_kudam_id
                credit_paise = min(kr[0]["saved_paise"], amount * 100)
                amount = max(1, amount - credit_paise // 100)
        try:
            rzp_order = rzp.order.create({"amount": amount * 100, "currency": "INR", "payment_capture": 1})
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Razorpay order failed: {e}")
        disp = prod.get("display_en") or {}
        order = sb.table("orders").insert({
            "public_reference": f"MNM-{uuid.uuid4().hex[:8].upper()}",
            "profile_id": uid, "status": "pending_payment",
            "subtotal_paise": base_paise, "discount_paise": discount_paise,
            "total_paise": amount * 100,
            "address_snapshot": {"pincode": user.get("pincode") or ""},
            "delivery_slot_snapshot": {"delivery_date": body.pickup_date, "window": window},
            "policy_snapshot": {"discount_percent": discount_percent, "discount_kudam_id": discount_kudam_id,
                                "redeem_kudam_id": redeem_kudam_id, "credit_paise": credit_paise},
        }).execute().data[0]
        sb.table("order_items").insert({
            "order_id": order["id"], "product_id": prod["id"], "species_id": prod["species_id"],
            "cut_id": prod["cut_id"],
            "item_snapshot": {"name": disp.get("name", ""), "tamil_name": disp.get("tamil_name", ""),
                              "price_per_kg": round(price_per_kg)},
            "quantity": 1, "net_weight_grams": int(body.qty_kg * 1000),
            "unit_price_paise": prod["base_price_paise"], "line_total_paise": amount * 100}).execute()
        sb.table("payment_attempts").insert({
            "order_id": order["id"], "amount_paise": amount * 100,
            "idempotency_key": str(uuid.uuid4()), "razorpay_order_id": rzp_order["id"],
            "quote_hash": hashlib.sha256(f"{order['id']}:{amount}".encode()).hexdigest(),
            "expires_at": (now_utc() + timedelta(hours=1)).isoformat()}).execute()

    return {"order_id": rzp_order["id"], "amount": amount * 100, "currency": "INR",
            "key_id": os.environ["RAZORPAY_KEY_ID"], "discount_percent": discount_percent,
            "credit_paise": credit_paise}


def verify_signature(body: VerifyIn):
    try:
        rzp.utility.verify_payment_signature({
            "razorpay_order_id": body.razorpay_order_id,
            "razorpay_payment_id": body.razorpay_payment_id,
            "razorpay_signature": body.razorpay_signature})
    except Exception:
        raise HTTPException(status_code=400, detail="Payment signature verification failed")


@api.post("/payments/verify")
def verify_payment(body: VerifyIn, user: dict = Depends(get_current_user)):
    uid = user["id"]
    ra = (sb.table("reservations").select("*")
          .eq("advance_razorpay_order_id", body.razorpay_order_id).eq("profile_id", uid).execute().data)
    if ra:
        r = ra[0]
        if r["status"] != "pending_advance":
            return {"ok": True, "already_processed": True}
        verify_signature(body)
        sb.table("reservations").update({"status": "reserved",
                                         "advance_payment_id": body.razorpay_payment_id}) \
            .eq("id", r["id"]).execute()
        return {"ok": True, "purpose": "reservation", "reservation_status": "reserved"}

    rb = (sb.table("reservations").select("*, products(*)")
          .eq("balance_razorpay_order_id", body.razorpay_order_id).eq("profile_id", uid).execute().data)
    if rb:
        r = rb[0]
        if r["status"] == "completed":
            return {"ok": True, "already_processed": True}
        verify_signature(body)
        prod = r.get("products") or {}
        disp = prod.get("display_en") or {}
        order = sb.table("orders").insert({
            "public_reference": f"MNM-{uuid.uuid4().hex[:8].upper()}",
            "profile_id": uid, "status": "confirmed",
            "subtotal_paise": r["total_paise"], "total_paise": r["total_paise"],
            "paid_at": now_utc().isoformat(), "confirmed_at": now_utc().isoformat(),
            "address_snapshot": {"pincode": user.get("pincode") or ""},
            "delivery_slot_snapshot": {"delivery_date": str(r.get("delivery_date") or ""), "window": "6:00 AM"},
            "policy_snapshot": {"reservation_id": r["id"], "advance_paise": r["advance_paise"],
                                "discount_percent": 0},
        }).execute().data[0]
        sb.table("order_items").insert({
            "order_id": order["id"], "product_id": r["product_id"],
            "species_id": prod.get("species_id"), "cut_id": prod.get("cut_id"),
            "item_snapshot": {"name": disp.get("name", ""), "tamil_name": disp.get("tamil_name", ""),
                              "price_per_kg": round((prod.get("base_price_paise") or 0) / 100)},
            "quantity": 1, "net_weight_grams": r["qty_grams"],
            "unit_price_paise": prod.get("base_price_paise") or 0,
            "line_total_paise": r["total_paise"]}).execute()
        sb.table("reservations").update({"status": "completed", "completed_at": now_utc().isoformat(),
                                         "balance_payment_id": body.razorpay_payment_id,
                                         "order_id": order["id"]}).eq("id", r["id"]).execute()
        full = sb.table("orders").select("*, order_items(*)").eq("id", order["id"]).execute().data[0]
        queue_order_notification(full, "booking_confirmed", user)
        return {"ok": True, "purpose": "reservation_complete", "booking": booking_out(full)}

    ka = (sb.table("kudam_payment_attempts").select("*")
          .eq("razorpay_order_id", body.razorpay_order_id).eq("profile_id", uid).execute().data)
    if ka:
        att = ka[0]
        if att["status"] == "paid":
            return {"ok": True, "already_processed": True}
        verify_signature(body)
        sb.table("kudam_payment_attempts").update(
            {"status": "paid", "provider_payment_id": body.razorpay_payment_id}).eq("id", att["id"]).execute()
        sb.table("kudam_deposits").insert({
            "kudam_id": att["kudam_id"], "profile_id": uid,
            "amount_paise": att["amount_paise"], "provider_payment_id": body.razorpay_payment_id}).execute()
        k = sb.table("kudams").select("*").eq("id", att["kudam_id"]).execute().data[0]
        new_saved = k["saved_paise"] + att["amount_paise"]
        upd = {"saved_paise": new_saved}
        if new_saved >= k["goal_paise"] and k["status"] == "active":
            upd["status"] = "complete"
        k = sb.table("kudams").update(upd).eq("id", k["id"]).execute().data[0]
        return {"ok": True, "purpose": "deposit", "kudam": kudam_out(k)}

    pa = (sb.table("payment_attempts").select("*, orders!inner(*)")
          .eq("razorpay_order_id", body.razorpay_order_id).execute().data)
    if not pa or pa[0]["orders"]["profile_id"] != uid:
        raise HTTPException(status_code=404, detail="Transaction not found")
    att = pa[0]
    if att["status"] == "paid":
        return {"ok": True, "already_processed": True}
    verify_signature(body)
    sb.table("payment_attempts").update(
        {"status": "paid", "client_result_received_at": now_utc().isoformat()}).eq("id", att["id"]).execute()
    sb.table("payments").insert({
        "payment_attempt_id": att["id"], "order_id": att["order_id"],
        "provider_payment_id": body.razorpay_payment_id, "status": "captured",
        "amount_paise": att["amount_paise"], "captured_at": now_utc().isoformat()}).execute()
    sb.table("orders").update({"status": "confirmed", "paid_at": now_utc().isoformat(),
                               "confirmed_at": now_utc().isoformat()}).eq("id", att["order_id"]).execute()
    policy = att["orders"].get("policy_snapshot") or {}
    if policy.get("discount_kudam_id"):
        sb.table("kudams").update({"status": "redeemed", "redeemed_at": now_utc().isoformat()}) \
            .eq("id", policy["discount_kudam_id"]).execute()
    if policy.get("redeem_kudam_id") and policy.get("redeem_kudam_id") != policy.get("discount_kudam_id"):
        sb.table("kudams").update({"status": "redeemed", "redeemed_at": now_utc().isoformat()}) \
            .eq("id", policy["redeem_kudam_id"]).execute()
    order = sb.table("orders").select("*, order_items(*)").eq("id", att["order_id"]).execute().data[0]
    queue_order_notification(order, "booking_confirmed", user)
    return {"ok": True, "purpose": "booking", "booking": booking_out(order)}


# ---------- Razorpay webhook ----------
def _process_captured_payment(rzp_order_id: str, entity: dict):
    att = (sb.table("payment_attempts").select("*, orders!inner(*)")
           .eq("razorpay_order_id", rzp_order_id).execute().data)
    if not att:
        return None
    att = att[0]
    sb.table("payment_attempts").update({"status": "paid"}).eq("id", att["id"]).execute()
    sb.table("payments").insert({
        "payment_attempt_id": att["id"], "order_id": att["order_id"],
        "provider_payment_id": entity.get("id"), "status": "captured",
        "amount_paise": entity.get("amount") or att["amount_paise"],
        "method_summary": {"method": entity.get("method")},
        "captured_at": now_utc().isoformat(), "provider_payload": entity}).execute()
    if att["orders"]["status"] == "pending_payment":
        sb.table("orders").update({"status": "confirmed", "paid_at": now_utc().isoformat(),
                                   "confirmed_at": now_utc().isoformat()}).eq("id", att["order_id"]).execute()
        order = (sb.table("orders").select("*, order_items(*), profiles(email, display_name)")
                 .eq("id", att["order_id"]).execute().data[0])
        queue_order_notification(order, "booking_confirmed")
    return att


def _process_failed_payment(rzp_order_id: str, entity: dict):
    att = sb.table("payment_attempts").select("id") \
        .eq("razorpay_order_id", rzp_order_id).execute().data
    if not att:
        return None
    sb.table("payment_attempts").update({"status": "failed"}).eq("id", att[0]["id"]).execute()
    return att[0]


@api.post("/payments/webhook")
async def razorpay_webhook(request: Request):
    secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET")
    if not secret:
        raise HTTPException(status_code=503, detail="Webhook not configured")
    raw = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    try:
        payload = json.loads(raw or b"{}")
    except Exception:
        payload = {}
    payload_hash = hashlib.sha256(raw).hexdigest()
    event_id = payload.get("event_id") or ""
    event_type = payload.get("event") or "unknown"
    signature_valid = False
    try:
        rzp.utility.verify_webhook_signature(raw.decode("utf-8", "replace"), signature, secret)
        signature_valid = True
    except Exception:
        pass
    account_id = payload.get("account_id") or ""
    correlation_id = str(uuid.uuid4())
    if account_id:
        try:
            correlation_id = str(uuid.UUID(account_id))
        except Exception:
            pass  # Razorpay account ids (acc_...) aren't UUIDs; fall back to ours
    try:
        sb.table("payment_webhook_events").insert({
            "provider": "razorpay", "provider_event_id": event_id or None,
            "event_type": event_type, "payload_hash": payload_hash,
            "signature_valid": signature_valid, "raw_payload": payload,
            "correlation_id": correlation_id,
        }).execute()
    except Exception:
        return {"ok": True, "already_processed": True}
    if not signature_valid:
        raise HTTPException(status_code=400, detail="Webhook signature verification failed")
    entity = (payload.get("payload") or {}).get("payment") or {}
    entity = entity.get("entity") or {}
    rzp_order_id = entity.get("order_id") or ""
    attempt = None
    if event_type == "payment.captured" and rzp_order_id:
        attempt = _process_captured_payment(rzp_order_id, entity)
    elif event_type == "payment.failed" and rzp_order_id:
        attempt = _process_failed_payment(rzp_order_id, entity)
    upd = {"processed_at": now_utc().isoformat()}
    if attempt:
        upd["payment_attempt_id"] = attempt["id"]
    sb.table("payment_webhook_events").update(upd) \
        .eq("payload_hash", payload_hash).eq("provider", "razorpay").execute()
    return {"ok": True, "processed": event_type in ("payment.captured", "payment.failed")}


# ---------- UPI Autopay (Razorpay subscriptions) ----------
class AutopayVerifyIn(BaseModel):
    razorpay_payment_id: str
    razorpay_subscription_id: str
    razorpay_signature: str


@api.post("/autopay/subscribe")
def autopay_subscribe(user: dict = Depends(get_current_user)):
    amt = user.get("daily_plan") or 5
    weekly = amt * 7
    try:
        plan = rzp.plan.create({"period": "weekly", "interval": 1,
                                "item": {"name": f"Meenamma Kudam ₹{amt}/day (billed ₹{weekly} weekly)",
                                         "amount": weekly * 100, "currency": "INR"}})
        sub = rzp.subscription.create({"plan_id": plan["id"], "total_count": 52, "customer_notify": 0})
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Razorpay autopay setup failed: {e}")
    sb.table("profiles").update({"autopay_subscription_id": sub["id"], "autopay_status": "pending"}) \
        .eq("id", user["id"]).execute()
    return {"subscription_id": sub["id"], "key_id": os.environ["RAZORPAY_KEY_ID"], "amount": amt,
            "weekly_amount": weekly}


@api.post("/autopay/verify")
def autopay_verify(body: AutopayVerifyIn, user: dict = Depends(get_current_user)):
    try:
        rzp.utility.verify_subscription_payment_signature({
            "razorpay_subscription_id": body.razorpay_subscription_id,
            "razorpay_payment_id": body.razorpay_payment_id,
            "razorpay_signature": body.razorpay_signature})
    except Exception:
        raise HTTPException(status_code=400, detail="Autopay signature verification failed")
    p = sb.table("profiles").update({"autopay_status": "active",
                                     "autopay_subscription_id": body.razorpay_subscription_id}) \
        .eq("id", user["id"]).execute().data[0]
    p["_role"] = user["_role"]
    return user_public(p)


@api.post("/autopay/cancel")
def autopay_cancel(user: dict = Depends(get_current_user)):
    if user.get("autopay_subscription_id"):
        try:
            rzp.subscription.cancel(user["autopay_subscription_id"])
        except Exception:
            pass
    p = sb.table("profiles").update({"autopay_status": "cancelled"}).eq("id", user["id"]).execute().data[0]
    p["_role"] = user["_role"]
    return user_public(p)


# ---------- Reservations (off-season catch, 25% advance) ----------
def reservation_out(r: dict) -> dict:
    prod = r.get("products") or {}
    disp = prod.get("display_en") or {}
    media = prod.get("media") or []
    return {"id": r["id"], "product_id": r["product_id"], "product_name": disp.get("name", ""),
            "tamil_name": disp.get("tamil_name", ""),
            "image": media[0].get("url", "") if media else "",
            "qty_kg": r["qty_grams"] / 1000, "total": round(r["total_paise"] / 100),
            "advance_paid": round(r["advance_paise"] / 100),
            "balance_due": round((r["total_paise"] - r["advance_paise"]) / 100),
            "status": r["status"], "delivery_date": r.get("delivery_date"),
            "created_at": r["created_at"]}


class ReservationIn(BaseModel):
    product_id: str
    qty_kg: float = Field(gt=0)


class ReservationCompleteIn(BaseModel):
    pickup_date: str


@api.get("/reservations")
def list_reservations(user: dict = Depends(get_current_user)):
    rows = (sb.table("reservations").select("*, products(display_en, media)")
            .eq("profile_id", user["id"]).neq("status", "pending_advance")
            .order("created_at", desc=True).execute().data)
    return [reservation_out(r) for r in rows]


@api.post("/reservations/create-order")
def reservation_create_order(body: ReservationIn, user: dict = Depends(get_current_user)):
    prows = sb.table("products").select("*").eq("id", body.product_id).neq("status", "archived").execute().data
    if not prows:
        raise HTTPException(status_code=404, detail="Product not found")
    prod = prows[0]
    if prod["status"] == "published":
        raise HTTPException(status_code=400, detail="This catch is in season — pre-book it instead")
    total_paise = round(prod["base_price_paise"] * body.qty_kg)
    advance_paise = max(100, round(total_paise * 0.25))
    try:
        rzp_order = rzp.order.create({"amount": advance_paise, "currency": "INR", "payment_capture": 1})
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Razorpay order failed: {e}")
    sb.table("reservations").insert({
        "profile_id": user["id"], "product_id": prod["id"], "qty_grams": int(body.qty_kg * 1000),
        "total_paise": total_paise, "advance_paise": advance_paise,
        "advance_razorpay_order_id": rzp_order["id"]}).execute()
    return {"order_id": rzp_order["id"], "amount": advance_paise, "currency": "INR",
            "key_id": os.environ["RAZORPAY_KEY_ID"], "discount_percent": 0}


@api.post("/reservations/{reservation_id}/complete-order")
def reservation_complete_order(reservation_id: str, body: ReservationCompleteIn,
                               user: dict = Depends(get_current_user)):
    rows = sb.table("reservations").select("*").eq("id", reservation_id) \
        .eq("profile_id", user["id"]).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Reservation not found")
    r = rows[0]
    if r["status"] != "arrived":
        raise HTTPException(status_code=400, detail="The catch has not landed yet")
    balance = r["total_paise"] - r["advance_paise"]
    try:
        rzp_order = rzp.order.create({"amount": balance, "currency": "INR", "payment_capture": 1})
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Razorpay order failed: {e}")
    sb.table("reservations").update({"balance_razorpay_order_id": rzp_order["id"],
                                     "delivery_date": body.pickup_date}).eq("id", r["id"]).execute()
    return {"order_id": rzp_order["id"], "amount": balance, "currency": "INR",
            "key_id": os.environ["RAZORPAY_KEY_ID"], "discount_percent": 0}


def queue_order_notification(order: dict, event_key: str, user: Optional[dict] = None):
    """Queue an outbox row for an order event and best-effort drain it."""
    prof = order.get("profiles") or user or {}
    items = order.get("order_items") or []
    it = items[0] if items else {}
    snap = it.get("item_snapshot") or {}
    slot = order.get("delivery_slot_snapshot") or {}
    payload = {
        "email": prof.get("email") or "",
        "name": prof.get("display_name") or prof.get("name") or "",
        "product": snap.get("name") or "",
        "reference": order.get("public_reference") or "",
        "amount": round((order.get("total_paise") or 0) / 100),
        "date": slot.get("delivery_date") or "",
        "slot": slot.get("window") or "6:00 AM",
    }
    if queue_notification(sb, aggregate_type="order", aggregate_id=order["id"],
                          event_key=event_key,
                          idempotency_key=f"booking:{order['id']}:{event_key}",
                          payload=payload):
        try:
            drain_notification_outbox(sb)
        except Exception:
            pass


def notify_catch_arrived(prod: dict):
    disp = prod.get("display_en") or {}
    res = (sb.table("reservations").select("*, profiles(email, display_name)")
           .eq("product_id", prod["id"]).eq("status", "reserved").execute().data)
    for r in res:
        sb.table("reservations").update({"status": "arrived", "arrived_at": now_utc().isoformat()}) \
            .eq("id", r["id"]).execute()
        prof = r.get("profiles") or {}
        queue_notification(sb, aggregate_type="reservation", aggregate_id=r["id"],
                           event_key="catch_arrived",
                           idempotency_key=f"reservation:{r['id']}:arrived",
                           payload={"email": prof.get("email"), "name": prof.get("display_name"),
                                    "product": disp.get("name"), "tamil_name": disp.get("tamil_name"),
                                    "message": f"{disp.get('name')} has landed. Complete your booking to claim your reserved catch."})


# ---------- Live stats (public) ----------
@api.get("/stats/live")
def stats_live():
    prods = sb.table("products").select("display_en, status").neq("status", "archived").execute().data
    live = [p for p in prods if p["status"] == "published"]
    harbours = len({(p.get("display_en") or {}).get("origin", "").split(",")[0].strip()
                    for p in live if (p.get("display_en") or {}).get("origin")})
    households = sb.table("profiles").select("id", count="exact").execute().count or 0
    kud = sb.table("kudams").select("saved_paise, status").execute().data
    items = sb.table("order_items").select("net_weight_grams, orders(status)").execute().data
    kg = sum(i["net_weight_grams"] for i in items
             if (i.get("orders") or {}).get("status") in ACTIVE_ORDER_STATUSES) / 1000
    return {"catches_live": len(live), "harbours": harbours,
            "kg_reserved": round(kg, 1), "households": households,
            "saved_rupees": round(sum(k["saved_paise"] for k in kud) / 100),
            "kudams_filled": len([k for k in kud if k["status"] in ("complete", "redeemed")])}


# ---------- Admin ----------
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


def ensure_cut() -> str:
    rows = sb.table("cuts").select("id").eq("code", "whole_cleaned").execute().data
    if rows:
        return rows[0]["id"]
    return sb.table("cuts").insert({"code": "whole_cleaned", "slug": "whole-cleaned",
                                    "display_en": {"name": "Whole · Cleaned"}}).execute().data[0]["id"]


def ensure_species(name: str, tamil: str = "") -> str:
    slug = slugify(name)
    rows = sb.table("species").select("id").eq("slug", slug).execute().data
    if rows:
        return rows[0]["id"]
    return sb.table("species").insert({"canonical_name": name, "slug": slug, "status": "published",
                                       "display_en": {"name": name},
                                       "display_ta": {"name": tamil}}).execute().data[0]["id"]


def product_row(body: ProductIn) -> dict:
    return {"status": "published" if body.available else "draft",
            "base_price_paise": body.price_per_kg * 100,
            "display_en": {"name": body.name, "tamil_name": body.tamil_name, "origin": body.origin,
                           "story": body.story, "handling": body.handling},
            "media": [{"url": body.image}] if body.image else []}


@api.post("/admin/products")
def admin_create_product(body: ProductIn, admin: dict = Depends(get_admin_user)):
    row = product_row(body)
    row.update({"species_id": ensure_species(body.name, body.tamil_name), "cut_id": ensure_cut(),
                "slug": f"{slugify(body.name)}-{uuid.uuid4().hex[:6]}",
                "sku": f"MNM-{uuid.uuid4().hex[:8].upper()}", "net_weight_grams": 1000})
    d = sb.table("products").insert(row).execute().data[0]
    return product_out(d)


@api.put("/admin/products/{product_id}")
def admin_update_product(product_id: str, body: ProductIn, admin: dict = Depends(get_admin_user)):
    old = sb.table("products").select("status").eq("id", product_id).execute().data
    if not old:
        raise HTTPException(status_code=404, detail="Product not found")
    was_available = old[0]["status"] == "published"
    rows = sb.table("products").update(product_row(body)).eq("id", product_id).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Product not found")
    if not was_available and body.available:
        notify_catch_arrived(rows[0])
    return product_out(rows[0])


@api.delete("/admin/products/{product_id}")
def admin_delete_product(product_id: str, admin: dict = Depends(get_admin_user)):
    rows = sb.table("products").update({"status": "archived", "archived_at": now_utc().isoformat()}) \
        .eq("id", product_id).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}


@api.get("/admin/stats")
def admin_stats(admin: dict = Depends(get_admin_user)):
    profiles_count = sb.table("profiles").select("id", count="exact").execute().count or 0
    admins = sb.table("staff_role_assignments").select("id", count="exact") \
        .eq("role", "ops_admin").is_("revoked_at", "null").execute().count or 0
    orders = sb.table("orders").select("total_paise").in_("status", ACTIVE_ORDER_STATUSES).execute().data
    kud = sb.table("kudams").select("saved_paise").execute().data
    products = sb.table("products").select("id", count="exact").neq("status", "archived").execute().count or 0
    return {"users": max(0, profiles_count - admins), "bookings": len(orders),
            "booking_revenue": round(sum(o["total_paise"] for o in orders) / 100),
            "total_saved": round(sum(k["saved_paise"] for k in kud) / 100), "products": products}


@api.get("/admin/bookings")
def admin_bookings(admin: dict = Depends(get_admin_user)):
    rows = (sb.table("orders").select("*, order_items(*), profiles(display_name, email)")
            .in_("status", ACTIVE_ORDER_STATUSES).order("created_at", desc=True).limit(500).execute().data)
    out = []
    for o in rows:
        b = booking_out(o)
        prof = o.get("profiles") or {}
        b["user"] = {"name": prof.get("display_name") or "", "email": prof.get("email") or ""}
        out.append(b)
    return out


@api.patch("/admin/bookings/{booking_id}/status")
def admin_update_booking(booking_id: str, body: BookingStatusIn, admin: dict = Depends(get_admin_user)):
    if body.status not in ("confirmed", "ready", "delivered", "cancelled"):
        raise HTTPException(status_code=400, detail="Invalid status")
    upd = {"status": body.status}
    if body.status == "delivered":
        upd["delivered_at"] = now_utc().isoformat()
    rows = sb.table("orders").update(upd).eq("id", booking_id).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Booking not found")
    order = sb.table("orders").select("*, order_items(*), profiles(email, display_name)").eq("id", booking_id).execute().data[0]
    if body.status in ("ready", "delivered"):
        queue_order_notification(order, f"booking_{body.status}")
    return booking_out(order)


@api.get("/admin/kudams")
def admin_kudams(admin: dict = Depends(get_admin_user)):
    rows = (sb.table("kudams").select("*, profiles(display_name, email)")
            .order("created_at", desc=True).limit(500).execute().data)
    out = []
    for d in rows:
        k = kudam_out(d)
        prof = d.get("profiles") or {}
        k["user"] = {"name": prof.get("display_name") or "", "email": prof.get("email") or ""}
        out.append(k)
    return out


@api.get("/admin/users")
def admin_users(admin: dict = Depends(get_admin_user)):
    profiles = (sb.table("profiles").select("*, staff_role_assignments!profile_id(role, revoked_at)")
                .order("created_at", desc=True).limit(500).execute().data)
    kudams = sb.table("kudams").select("profile_id").execute().data
    orders = sb.table("orders").select("profile_id").in_("status", ACTIVE_ORDER_STATUSES).execute().data
    kc, oc = {}, {}
    for k in kudams:
        kc[k["profile_id"]] = kc.get(k["profile_id"], 0) + 1
    for o in orders:
        oc[o["profile_id"]] = oc.get(o["profile_id"], 0) + 1
    out = []
    for p in profiles:
        roles = [r["role"] for r in (p.get("staff_role_assignments") or []) if not r.get("revoked_at")]
        out.append({"id": p["id"], "email": p.get("email") or "", "name": p.get("display_name") or "",
                    "role": "admin" if "ops_admin" in roles else "user", "created_at": p["created_at"],
                    "kudam_count": kc.get(p["id"], 0), "booking_count": oc.get(p["id"], 0)})
    return out


UPLOAD_DIR = "/tmp/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@api.post("/admin/upload")
async def admin_upload(file: UploadFile = File(...), admin: dict = Depends(get_admin_user)):
    ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
    if ext not in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
        raise HTTPException(status_code=400, detail="Only image files allowed")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB")
    fname = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(UPLOAD_DIR, fname), "wb") as f:
        f.write(data)
    return {"url": f"/api/uploads/{fname}"}


# ---------- Notifications (outbox -> email worker) ----------
@api.get("/notifications/process")
def process_notifications(admin: dict = Depends(get_admin_user)):
    return {"ok": True, **drain_notification_outbox(sb)}


@api.get("/admin/notifications")
def admin_notifications(admin: dict = Depends(get_admin_user)):
    rows = (sb.table("notification_outbox").select("*")
            .order("created_at", desc=True).limit(50).execute().data)
    return rows


@api.get("/admin/webhooks")
def admin_webhooks(admin: dict = Depends(get_admin_user)):
    rows = (sb.table("payment_webhook_events").select("*")
            .order("received_at", desc=True).limit(50).execute().data)
    return rows


@api.get("/health")
def health():
    return {"status": "ok", "db": "supabase"}


app.include_router(api)
app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
