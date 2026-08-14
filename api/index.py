from dotenv import load_dotenv
load_dotenv()

import os
import re
import json
import uuid
import hashlib
import secrets
import razorpay
from datetime import datetime, timezone, timedelta, date
from typing import Literal, Optional
from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from supabase import create_client
from supertokens_python.recipe.session.interfaces import SessionContainer
from api.supertokens_config import (GOOGLE_ENABLED, bootstrap_session, session_identity,
                                    supertokens_middleware, verified_session)
from api.notify import drain_notification_outbox, queue_notification
from api import ladder

SUPABASE_URL = os.environ.get("SUPABASE_URL", os.environ.get("NEXT_PUBLIC_SUPABASE_URL"))
sb = create_client(SUPABASE_URL, os.environ.get("SUPABASE_SERVICE_ROLE_KEY"))
import httpx as _httpx
_old = sb.postgrest.session
sb.postgrest.session = _httpx.Client(
    base_url=_old.base_url, headers=_old.headers, timeout=_old.timeout,
    limits=_httpx.Limits(max_connections=20, max_keepalive_connections=10, keepalive_expiry=15),
    transport=_httpx.HTTPTransport(retries=2),
)
rzp = razorpay.Client(auth=(os.environ.get("RAZORPAY_KEY_ID", ""), os.environ.get("RAZORPAY_KEY_SECRET", "")))

app = FastAPI(title="Meenamma API")
api = APIRouter(prefix="/api")


def now_utc():
    return datetime.now(timezone.utc)


def slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "item"


def require_razorpay_config() -> str:
    key_id = os.environ.get("RAZORPAY_KEY_ID", "").strip()
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET", "").strip()
    if not key_id or not key_secret:
        raise HTTPException(
            status_code=503,
            detail="Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
        )
    return key_id


# ---------- Auth ----------
async def get_current_user(auth_session: SessionContainer = Depends(verified_session)) -> dict:
    user_id, email = await session_identity(auth_session)
    rows = (sb.table("profiles")
            .select("*, staff_role_assignments!profile_id(role, revoked_at)")
            .eq("id", user_id).execute().data)
    if not rows:
        sb.table("profiles").insert({"id": user_id, "email": email}).execute()
        rows = (sb.table("profiles")
                .select("*, staff_role_assignments!profile_id(role, revoked_at)")
                .eq("id", user_id).execute().data)
    p = rows[0]
    if p.get("email") != email:
        sb.table("profiles").update({"email": email}).eq("id", user_id).execute()
        p["email"] = email
    roles = [r["role"] for r in (p.get("staff_role_assignments") or []) if not r.get("revoked_at")]
    p["_role"] = "admin" if "ops_admin" in roles else "user"
    retire_legacy_autopay(p)
    return p


def retire_legacy_autopay(p: dict) -> None:
    """Cancel a pre-ladder flat-amount subscription on the user's next login.

    Legacy subscribers ride a fixed-amount plan that cannot bill a climbing amount, and no
    Razorpay API converts one into a quantity-lever plan. They are identified by an active
    autopay with no ladder anchor, and must re-register; the dashboard prompts them.
    """
    if p.get("autopay_status") != "active" or p.get("cycle_anchor_date"):
        return
    if p.get("autopay_subscription_id"):
        try:
            rzp.subscription.cancel(p["autopay_subscription_id"])
        except Exception:
            p["legacy_autopay_retire_failed"] = True
            return  # Do not claim cancellation while the provider may still charge it.
    sb.table("profiles").update({"autopay_status": "cancelled",
                                 "autopay_cadence": "manual"}).eq("id", p["id"]).execute()
    p["autopay_status"] = "cancelled"
    p["autopay_cadence"] = "manual"
    p["legacy_autopay_retired"] = True


def get_admin_user(user: dict = Depends(get_current_user)) -> dict:
    if user["_role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def user_public(p: dict) -> dict:
    return {"id": p["id"], "email": p.get("email") or "", "name": p.get("display_name") or "",
            "role": p.get("_role", "user"), "daily_plan": p.get("daily_plan") or 5,
            "pincode": p.get("pincode") or "", "upi_id": p.get("upi_id") or "",
            "autopay_status": p.get("autopay_status") or "none", "locale": p.get("locale") or "en",
            "autopay_cadence": p.get("autopay_cadence") or "manual",
            "step_amount": round((p.get("step_paise") or 0) / 100),
            "legacy_autopay_retired": bool(p.get("legacy_autopay_retired"))}


@api.get("/config/auth")
def auth_config():
    return {"google_enabled": GOOGLE_ENABLED}


@api.get("/auth/me")
def me(user: dict = Depends(get_current_user)):
    return user_public(user)


class ProfileIn(BaseModel):
    name: Optional[str] = None
    daily_plan: Optional[int] = None
    pincode: Optional[str] = None
    upi_id: Optional[str] = None
    locale: Optional[str] = None


def profile_updates(body: ProfileIn) -> dict:
    upd = {}
    if body.name:
        upd["display_name"] = body.name
    if body.daily_plan in (1, 5, 10):
        upd["daily_plan"] = body.daily_plan
    if body.pincode is not None:
        upd["pincode"] = body.pincode
    if body.upi_id is not None:
        upd["upi_id"] = body.upi_id
    if body.locale is not None:
        if body.locale not in ("en", "ta"):
            raise HTTPException(status_code=400, detail="locale must be 'en' or 'ta'")
        upd["locale"] = body.locale
    return upd


@api.post("/profile/bootstrap")
async def bootstrap_profile(body: ProfileIn,
                            auth_session: SessionContainer = Depends(bootstrap_session)):
    user_id, email = await session_identity(auth_session)
    upd = {"id": user_id, "email": email, **profile_updates(body)}
    sb.table("profiles").upsert(upd, on_conflict="id").execute()
    
    # Idempotent first Kudam creation
    existing = sb.table("kudams").select("id").eq("profile_id", user_id).execute().data
    if not existing:
        sb.table("kudams").insert({
            "profile_id": user_id,
            "name": "First Vessel",
            "goal_paise": 1000 * 100
        }).execute()
        
    return {"ok": True}


@api.patch("/me")
def update_me(body: ProfileIn, user: dict = Depends(get_current_user)):
    upd = profile_updates(body)
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
    active_pots = sb.table("kudams").select("id").eq("profile_id", user["id"]).eq("status", "active").execute().data
    if active_pots:
        raise HTTPException(
            status_code=400,
            detail="You already have an active savings pot. Complete or redeem it before creating a new one."
        )
    d = sb.table("kudams").insert({"profile_id": user["id"], "name": body.name,
                                   "goal_paise": body.goal_amount * 100}).execute().data[0]
    return kudam_out(d)


@api.delete("/kudams/{kudam_id}")
def delete_kudam(kudam_id: str, user: dict = Depends(get_current_user)):
    rows = sb.table("kudams").select("*").eq("id", kudam_id).eq("profile_id", user["id"]).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Kudam not found")
    k = rows[0]
    if k["status"] == "active" and user.get("autopay_status") == "active":
        active_vessels = sb.table("kudams").select("id").eq("profile_id", user["id"]).eq("status", "active").execute().data
        if len(active_vessels) <= 1:
            raise HTTPException(status_code=400,
                                detail="Cannot delete the last vessel while an active savings ladder is running. Stop the savings ladder first.")
    if k["saved_paise"] > 0:
        raise HTTPException(status_code=400,
                            detail="This kudam holds savings. Spend or redeem it before deleting.")
    # Clean up any unpaid Razorpay attempt rows that reference the kudam (FK)
    attempts = sb.table("kudam_payment_attempts").select("id") \
        .eq("kudam_id", kudam_id).neq("status", "paid").execute().data
    for a in attempts:
        sb.table("kudam_payment_attempts").delete().eq("id", a["id"]).execute()
    sb.table("kudams").delete().eq("id", kudam_id).execute()
    return {"ok": True}


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
def product_display(prod: dict, lang: str = "en") -> dict:
    """Locale-aware display fields. Tamil name lives in display_en.tamil_name
    for seeded products, with display_ta as the (optional) richer Tamil block."""
    en = prod.get("display_en") or {}
    ta = prod.get("display_ta") or {}
    if lang == "ta":
        return {"name": ta.get("name") or en.get("tamil_name") or en.get("name", ""),
                "tamil_name": en.get("name", ""),
                "origin": ta.get("origin") or en.get("origin", ""),
                "story": ta.get("story") or en.get("story", ""),
                "handling": ta.get("handling") or en.get("handling", "")}
    return {"name": en.get("name", ""),
            "tamil_name": ta.get("name") or en.get("tamil_name", ""),
            "origin": en.get("origin", ""),
            "story": en.get("story", ""),
            "handling": en.get("handling", "")}


def product_out(d: dict, lang: str = "en") -> dict:
    disp = product_display(d, lang)
    media = d.get("media") or []
    return {"id": d["id"], "name": disp["name"], "tamil_name": disp["tamil_name"],
            "price_per_kg": round(d["base_price_paise"] / 100),
            "image": media[0].get("url", "") if media else "",
            "origin": disp["origin"], "story": disp["story"],
            "handling": disp["handling"], "available": d["status"] == "published"}


@api.get("/products")
def list_products(lang: str = "en"):
    if lang not in ("en", "ta"):
        raise HTTPException(status_code=400, detail="lang must be 'en' or 'ta'")
    rows = (sb.table("products").select("*").neq("status", "archived")
            .order("created_at", desc=False).execute().data)
    return [product_out(d, lang) for d in rows]


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
    key_id = require_razorpay_config()
    if body.purpose not in ("deposit", "booking"):
        raise HTTPException(status_code=400, detail="Invalid purpose")
    uid = user["id"]
    discount_percent = 0
    credit_paise = 0

    if body.purpose == "deposit":
        if not body.kudam_id or not body.amount:
            raise HTTPException(status_code=400, detail="kudam_id and amount required")
        krows = sb.table("kudams").select("id,status").eq("id", body.kudam_id).eq("profile_id", uid).execute().data
        if not krows:
            raise HTTPException(status_code=404, detail="Kudam not found")
        if krows[0]["status"] != "active":
            raise HTTPException(status_code=400, detail="Only active kudams can accept deposits")
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
        disp = product_display(prod, user.get("locale") or "en")
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
            "key_id": key_id, "discount_percent": discount_percent,
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
        disp = product_display(prod, user.get("locale") or "en")
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


def _credit_autopay_deposit(subscription_id: str, entity: dict) -> bool:
    """Settle a subscription payment against the profile's oldest accruals."""
    prof = (sb.table("profiles").select("id")
            .eq("autopay_subscription_id", subscription_id).execute().data)
    if not prof:
        return False
    return _settle_autopay_payment(prof[0]["id"], entity)


def _settle_autopay_payment(profile_id: str, entity: dict) -> bool:
    """Atomically credit one capture and stamp the fully covered accrual rows."""
    pay_id = entity.get("id") or ""
    amount = entity.get("amount") or 0
    if not profile_id or not pay_id or amount <= 0:
        return False
    result = sb.rpc("settle_autopay_payment", {
        "p_profile_id": profile_id, "p_payment_id": pay_id,
        "p_captured_paise": amount,
    }).execute().data
    row = result[0] if isinstance(result, list) and result else result or {}
    return row.get("status") in ("settled", "duplicate")


def _queue_autopay_event(profile: dict, event_key: str, event_id: str,
                         **payload) -> bool:
    return queue_notification(
        sb, aggregate_type="profile", aggregate_id=profile["id"], event_key=event_key,
        idempotency_key=f"autopay:{profile['id']}:{event_key}:{event_id}",
        payload={"email": profile.get("email") or "",
                 "name": profile.get("display_name") or "", **payload})


def _record_failed_autopay(subscription_id: str, entity: dict) -> bool:
    profiles = (sb.table("profiles").select("id,email,display_name")
                .eq("autopay_subscription_id", subscription_id).execute().data)
    if not profiles:
        return False
    return _queue_autopay_event(
        profiles[0], "autopay_payment_failed", entity.get("id") or "unknown")


def _activate_autopay(subscription_id: str) -> bool:
    if not subscription_id:
        return False
    rows = (sb.table("profiles").select("id,cycle_anchor_date")
            .eq("autopay_subscription_id", subscription_id).execute().data)
    if not rows:
        return False
    updates = {"autopay_status": "active"}
    if not rows[0].get("cycle_anchor_date"):
        updates["cycle_anchor_date"] = now_utc().date().isoformat()
    sb.table("profiles").update(updates).eq("id", rows[0]["id"]).execute()
    return True


def _dispatch_razorpay_event(event_type: str, event_payload: dict):
    entity = ((event_payload.get("payment") or {}).get("entity") or {})
    subscription = ((event_payload.get("subscription") or {}).get("entity") or {})
    payment_link = ((event_payload.get("payment_link") or {}).get("entity") or {})
    order_id = entity.get("order_id") or ""
    subscription_id = entity.get("subscription_id") or ""
    attempt = None
    credited = False
    if event_type == "payment.captured" and subscription_id:
        credited = _credit_autopay_deposit(subscription_id, entity)
    elif event_type == "payment.failed" and subscription_id:
        _record_failed_autopay(subscription_id, entity)
    elif event_type == "payment.captured" and order_id:
        attempt = _process_captured_payment(order_id, entity)
        profile_id = (entity.get("notes") or {}).get("profile_id")
        if not attempt and profile_id:
            credited = _settle_autopay_payment(profile_id, entity)
    elif event_type == "payment.failed" and order_id:
        attempt = _process_failed_payment(order_id, entity)
    elif event_type == "payment_link.paid":
        profile_id = (payment_link.get("notes") or {}).get("profile_id")
        credited = _settle_autopay_payment(profile_id, entity)
    elif event_type == "subscription.activated":
        _activate_autopay(subscription.get("id") or "")
    return attempt, credited


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
    attempt, credited_autopay = _dispatch_razorpay_event(
        event_type, payload.get("payload") or {})
    upd = {"processed_at": now_utc().isoformat()}
    if attempt:
        upd["payment_attempt_id"] = attempt["id"]
    sb.table("payment_webhook_events").update(upd) \
        .eq("payload_hash", payload_hash).eq("provider", "razorpay").execute()
    return {"ok": True, "processed": event_type in ("payment.captured", "payment.failed"),
            "autopay_credited": credited_autopay}


# ---------- Autopay: incremental savings ladder ----------
# Accrual runs daily in our database; settlement charges the unsettled sum on the user's
# chosen cadence. A single plan per cadence bills every subscriber, because Razorpay charges
# plan.item.amount * quantity and we vary the quantity. See api/ladder.py for the math.
class AutopaySubscribeIn(BaseModel):
    step_amount: int = Field(gt=0, le=100)
    cadence: Literal["daily", "weekly", "monthly", "manual"]


class AutopayVerifyIn(BaseModel):
    razorpay_payment_id: str
    razorpay_subscription_id: str
    razorpay_signature: str


# Razorpay's own billing period per cadence. Only the sweep frequency differs; the amount is
# always carried by the quantity.
_CADENCE_PERIOD = {"daily": "daily", "weekly": "weekly", "monthly": "monthly"}

# Long enough that a subscription outlives the ladder rather than expiring mid-cycle.
_TOTAL_COUNT = {"daily": 365, "weekly": 52, "monthly": 12}


def shared_plan_id(cadence: str, key_id: str) -> str:
    """Get or create the shared Rs 1-per-unit plan for a cadence.

    Cached in razorpay_plans keyed by (cadence, key_id) so that switching between test and
    live keys never reuses a plan the other environment cannot see.
    """
    cached = (sb.table("razorpay_plans").select("razorpay_plan_id")
              .eq("cadence", cadence).eq("razorpay_key_id", key_id).execute().data)
    if cached:
        return cached[0]["razorpay_plan_id"]
    try:
        plan = rzp.plan.create({
            "period": _CADENCE_PERIOD[cadence], "interval": 1,
            "item": {"name": f"Meenamma Kudam savings ({cadence}, ₹1 unit)",
                     "amount": ladder.PLAN_UNIT_PAISE, "currency": "INR"}})
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Razorpay plan setup failed: {e}")
    try:
        sb.table("razorpay_plans").insert({
            "cadence": cadence, "razorpay_key_id": key_id, "razorpay_plan_id": plan["id"],
            "unit_amount_paise": ladder.PLAN_UNIT_PAISE}).execute()
    except Exception:
        # Lost a race with a concurrent subscribe; the row that won is equally valid.
        rows = (sb.table("razorpay_plans").select("razorpay_plan_id")
                .eq("cadence", cadence).eq("razorpay_key_id", key_id).execute().data)
        if rows:
            return rows[0]["razorpay_plan_id"]
        raise
    return plan["id"]


def autopay_out(p: dict) -> dict:
    """Ladder state for the dashboard: where the user is and what they owe."""
    step_paise = p.get("step_paise") or 0
    anchor = p.get("cycle_anchor_date")
    out = {"status": p.get("autopay_status") or "none",
           "cadence": p.get("autopay_cadence") or "manual",
           "step_amount": round(step_paise / 100) if step_paise else 0,
           "cycle_day": None, "next_amount": None, "unsettled_amount": 0}
    if not anchor or not step_paise:
        return out
    anchor_date = date.fromisoformat(anchor) if isinstance(anchor, str) else anchor
    today = now_utc().date()
    if today >= anchor_date:
        day = ladder.cycle_day(today, anchor_date)
        out["cycle_day"] = day
        out["next_amount"] = round(ladder.accrual_paise(step_paise, day) / 100)
    rows = (sb.table("autopay_accruals").select("amount_paise, settled_at")
            .eq("profile_id", p["id"]).is_("settled_at", "null").execute().data)
    out["unsettled_amount"] = round(ladder.due_paise(rows) / 100)
    return out


@api.get("/autopay")
def autopay_state(user: dict = Depends(get_current_user)):
    return autopay_out(user)


def _cancel_razorpay_subscription(subscription_id: str) -> None:
    """Cancel at the provider before changing the local billing state."""
    try:
        rzp.subscription.cancel(subscription_id)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Razorpay subscription cancellation failed: {e}",
        )


def _autopay_checkout_payload(subscription_id: str, key_id: str,
                              body: AutopaySubscribeIn) -> dict:
    step_paise = body.step_amount * 100
    return {
        "subscription_id": subscription_id,
        "key_id": key_id,
        "step_amount": body.step_amount,
        "cadence": body.cadence,
        "max_amount": round(ladder.mandate_max_paise(step_paise) / 100),
        "cycle_total": round(ladder.cycle_total_paise(step_paise) / 100),
    }


@api.post("/autopay/subscribe")
def autopay_subscribe(body: AutopaySubscribeIn, user: dict = Depends(get_current_user)):
    step_paise = body.step_amount * 100
    existing_id = user.get("autopay_subscription_id")
    existing_status = user.get("autopay_status") or "none"
    if existing_id and existing_status == "active":
        raise HTTPException(
            status_code=409,
            detail="Cancel the current autopay subscription before creating another one.",
        )

    if existing_id and existing_status == "pending":
        same_selection = (
            body.cadence != "manual"
            and user.get("autopay_cadence") == body.cadence
            and user.get("step_paise") == step_paise
        )
        if same_selection:
            key_id = require_razorpay_config()
            return _autopay_checkout_payload(existing_id, key_id, body)

        _cancel_razorpay_subscription(existing_id)
        sb.table("profiles").update({
            "autopay_subscription_id": None,
            "autopay_status": "cancelled",
        }).eq("id", user["id"]).execute()

    if body.cadence == "manual":
        p = sb.table("profiles").update({
            "autopay_subscription_id": None, "autopay_status": "active",
            "autopay_cadence": "manual", "step_paise": step_paise,
            "cycle_anchor_date": now_utc().date().isoformat()}) \
            .eq("id", user["id"]).execute().data[0]
        p["_role"] = user["_role"]
        return {**user_public(p), "manual": True, "autopay": autopay_out(p)}
    key_id = require_razorpay_config()
    plan_id = shared_plan_id(body.cadence, key_id)
    try:
        sub = rzp.subscription.create({
            "plan_id": plan_id, "total_count": _TOTAL_COUNT[body.cadence],
            "quantity": 1, "customer_notify": 0,
            "notes": {"profile_id": user["id"], "step_paise": str(step_paise),
                      "cadence": body.cadence}})
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Razorpay autopay setup failed: {e}")
    sb.table("profiles").update({
        "autopay_subscription_id": sub["id"], "autopay_status": "pending",
        "autopay_cadence": body.cadence, "step_paise": step_paise}) \
        .eq("id", user["id"]).execute()
    return _autopay_checkout_payload(sub["id"], key_id, body)


@api.post("/autopay/verify")
def autopay_verify(body: AutopayVerifyIn, user: dict = Depends(get_current_user)):
    require_razorpay_config()
    if body.razorpay_subscription_id != user.get("autopay_subscription_id"):
        raise HTTPException(status_code=400, detail="Autopay subscription does not match this account")
    try:
        rzp.utility.verify_subscription_payment_signature({
            "razorpay_subscription_id": body.razorpay_subscription_id,
            "razorpay_payment_id": body.razorpay_payment_id,
            "razorpay_signature": body.razorpay_signature})
    except Exception:
        raise HTTPException(status_code=400, detail="Autopay signature verification failed")
    # Signature verification proves checkout ownership. Razorpay's subscription.activated
    # webhook is authoritative for mandate activation and starts the accrual clock.
    p = sb.table("profiles").update({
        "autopay_status": "active" if user.get("autopay_status") == "active" else "pending",
        "autopay_subscription_id": body.razorpay_subscription_id}) \
        .eq("id", user["id"]).execute().data[0]
    p["_role"] = user["_role"]
    return {**user_public(p), "autopay": autopay_out(p)}


@api.post("/autopay/cancel")
def autopay_cancel(user: dict = Depends(get_current_user)):
    if user.get("autopay_subscription_id"):
        _cancel_razorpay_subscription(user["autopay_subscription_id"])
    # Accruals are left untouched: money already owed stays owed and can be settled by link.
    p = sb.table("profiles").update({"autopay_subscription_id": None,
                                     "autopay_status": "cancelled",
                                     "autopay_cadence": "manual"}) \
        .eq("id", user["id"]).execute().data[0]
    p["_role"] = user["_role"]
    return user_public(p)


def _active_ladder_profiles():
    return (sb.table("profiles")
            .select("id,email,display_name,step_paise,autopay_cadence,"
                    "cycle_anchor_date,autopay_subscription_id")
            .eq("autopay_status", "active").execute().data)


def _parse_anchor(value) -> Optional[date]:
    if isinstance(value, date):
        return value
    if not value:
        return None
    return date.fromisoformat(value)


def _unsettled_accruals(profile_id: str):
    return (sb.table("autopay_accruals")
            .select("id,debit_date,amount_paise,settled_at")
            .eq("profile_id", profile_id).is_("settled_at", "null")
            .order("debit_date", desc=False).execute().data)


def run_daily_accruals(target_date: date) -> dict:
    """Insert the deterministic ladder rung for every active enrolment."""
    rows = []
    skipped = 0
    for profile in _active_ladder_profiles():
        anchor = _parse_anchor(profile.get("cycle_anchor_date"))
        step_paise = profile.get("step_paise") or 0
        if not anchor or target_date < anchor or step_paise <= 0:
            skipped += 1
            continue
        day = ladder.cycle_day(target_date, anchor)
        rows.append({
            "profile_id": profile["id"], "debit_date": target_date.isoformat(),
            "cycle_day": day, "amount_paise": ladder.accrual_paise(step_paise, day),
        })
    if rows:
        sb.table("autopay_accruals").upsert(
            rows, on_conflict="profile_id,debit_date").execute()
    return {"date": target_date.isoformat(), "accrued": len(rows), "skipped": skipped}


def _notification_exists(idempotency_key: str) -> bool:
    rows = (sb.table("notification_outbox").select("id")
            .eq("idempotency_key", idempotency_key).limit(1).execute().data)
    return bool(rows)


def _sweep_profile(profile: dict, target_date: date) -> str:
    anchor = _parse_anchor(profile.get("cycle_anchor_date"))
    cadence = profile.get("autopay_cadence") or "manual"
    if not anchor or not ladder.should_notify(target_date, cadence, anchor):
        return "skipped"
    accruals = _unsettled_accruals(profile["id"])
    due = ladder.due_paise(accruals)
    if due <= 0:
        return "skipped"
    debit_date = (target_date + timedelta(days=1)).isoformat()
    ceiling = ladder.mandate_max_paise(profile.get("step_paise") or 0)
    if due > ceiling:
        _queue_autopay_event(
            profile, "autopay_dunning", debit_date,
            amount=round(due / 100), debit_date=debit_date)
        return "dunning"
    notification_key = f"autopay:{profile['id']}:autopay_predebit:{debit_date}"
    if _notification_exists(notification_key):
        return "skipped"
    quantity, charge_paise, _ = ladder.settlement_split(due)
    if quantity <= 0 or not profile.get("autopay_subscription_id"):
        return "skipped"
    try:
        rzp.subscription.edit(profile["autopay_subscription_id"], {
            "quantity": quantity, "schedule_change_at": "cycle_end",
            "customer_notify": False,
        })
    except Exception:
        _queue_autopay_event(
            profile, "autopay_update_failed", debit_date,
            amount=round(charge_paise / 100), debit_date=debit_date)
        return "failed"
    _queue_autopay_event(
        profile, "autopay_predebit", debit_date,
        amount=round(charge_paise / 100), debit_date=debit_date, cadence=cadence)
    return "scheduled"


def run_predebit_sweep(target_date: date) -> dict:
    """Schedule tomorrow's quantities and queue the required pre-debit notices."""
    outcomes = {"scheduled": 0, "dunning": 0, "failed": 0, "skipped": 0}
    for profile in _active_ladder_profiles():
        cadence = profile.get("autopay_cadence") or "manual"
        if cadence == "manual":
            outcomes["skipped"] += 1
            continue
        outcome = _sweep_profile(profile, target_date)
        outcomes[outcome] += 1
    try:
        outcomes["notifications"] = drain_notification_outbox(sb)
    except Exception:
        outcomes["notifications"] = {"sent": 0, "failed": 1}
    return {"date": target_date.isoformat(), **outcomes}


def require_cron(request: Request) -> None:
    expected = (os.environ.get("AUTOPAY_CRON_SECRET") or
                os.environ.get("CRON_SECRET") or "")
    if not expected:
        raise HTTPException(status_code=503, detail="Cron secret is not configured")
    supplied = request.headers.get("Authorization", "")
    valid = supplied.startswith("Bearer ") and secrets.compare_digest(
        supplied[7:], expected)
    if not valid:
        raise HTTPException(status_code=401, detail="Invalid cron credentials")


def _cron_date(for_date: Optional[str]) -> date:
    if not for_date:
        return now_utc().date()
    try:
        return date.fromisoformat(for_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="for_date must be YYYY-MM-DD")


@api.get("/cron/autopay/accrue", dependencies=[Depends(require_cron)])
def cron_autopay_accrue(for_date: Optional[str] = None):
    return {"ok": True, **run_daily_accruals(_cron_date(for_date))}


@api.get("/cron/autopay/pre-notify", dependencies=[Depends(require_cron)])
def cron_autopay_pre_notify(for_date: Optional[str] = None):
    return {"ok": True, **run_predebit_sweep(_cron_date(for_date))}


@api.get("/cron/autopay/daily", dependencies=[Depends(require_cron)])
def cron_autopay_daily(for_date: Optional[str] = None):
    target_date = _cron_date(for_date)
    return {"ok": True, "accrual": run_daily_accruals(target_date),
            "pre_notify": run_predebit_sweep(target_date)}


@api.post("/autopay/payment-link")
def autopay_payment_link(user: dict = Depends(get_current_user)):
    require_razorpay_config()
    due = ladder.due_paise(_unsettled_accruals(user["id"]))
    if due <= 0:
        raise HTTPException(status_code=400, detail="There is no unsettled savings balance")
    reference_id = f"kudam-{uuid.uuid4().hex[:24]}"
    app_url = (os.environ.get("APP_URL") or os.environ.get("NEXT_PUBLIC_APP_URL") or
               "http://localhost:3000").rstrip("/")
    payload = {
        "amount": due, "currency": "INR", "accept_partial": False,
        "reference_id": reference_id, "description": "Meenamma kudam savings",
        "customer": {"name": user.get("display_name") or "",
                     "email": user.get("email") or ""},
        "notify": {"sms": False, "email": bool(user.get("email"))},
        "notes": {"profile_id": user["id"], "kind": "autopay_accruals"},
        "callback_url": f"{app_url}/dashboard", "callback_method": "get",
    }
    try:
        payment_link = rzp.payment_link.create(payload)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Razorpay payment link failed: {e}")
    return {"payment_link_id": payment_link["id"], "url": payment_link["short_url"],
            "amount": round(due / 100), "currency": "INR"}


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
    key_id = require_razorpay_config()
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
            "key_id": key_id, "discount_percent": 0}


@api.post("/reservations/{reservation_id}/complete-order")
def reservation_complete_order(reservation_id: str, body: ReservationCompleteIn,
                               user: dict = Depends(get_current_user)):
    key_id = require_razorpay_config()
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
            "key_id": key_id, "discount_percent": 0}


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
app.add_middleware(supertokens_middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["front-token"],
)
