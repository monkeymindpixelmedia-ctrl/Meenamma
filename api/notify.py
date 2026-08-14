"""Notification worker for Meenamma.

Drains `notification_outbox` rows into real emails via the Resend REST API
(httpx — no new dependency). The outbox is the source of truth: rows stay
queued (with attempt_count/last_error bumped) when sending fails, and are a
no-op when RESEND_API_KEY is unset, so enabling mail later needs no code change.
"""
import os
from datetime import datetime, timezone

import httpx

RESEND_ENDPOINT = "https://api.resend.com/emails"
EMAIL_FROM = os.environ.get("NOTIFICATIONS_FROM_EMAIL", "Meenamma <noreply@meenamma.org>")
MAX_ATTEMPTS = 3

SUBJECTS = {
    "autopay_dunning": "Your Meenamma savings balance needs attention",
    "autopay_payment_failed": "Your Meenamma savings payment did not go through",
    "autopay_predebit": "Upcoming Meenamma savings debit",
    "autopay_update_failed": "Action needed for your Meenamma savings debit",
    "catch_arrived": "Your reserved catch has landed",
    "booking_confirmed": "Your catch is confirmed",
    "booking_ready": "Your catch is ready",
    "booking_delivered": "Your catch has been delivered",
}


def _body(event_key: str, payload: dict, product: str) -> str:
    """Inner HTML for an outbox event (sibling ifs keep nesting flat)."""
    if event_key == "autopay_predebit":
        amount = payload.get("amount") or 0
        debit_date = payload.get("debit_date") or "tomorrow"
        return (
            f"<p>Your next kudam savings debit is <strong>₹{amount}</strong> on {debit_date}.</p>"
            "<p>Please keep sufficient balance in the account linked to your mandate.</p>"
        )
    if event_key == "autopay_dunning":
        amount = payload.get("amount") or 0
        return (
            f"<p>Your unsettled kudam balance is <strong>₹{amount}</strong>.</p>"
            "<p>It is above the authorised one-cycle ceiling, so we did not attempt a debit. "
            "Please use the manual payment option in Meenamma.</p>"
        )
    if event_key in ("autopay_payment_failed", "autopay_update_failed"):
        return (
            "<p>We could not process your scheduled kudam savings debit.</p>"
            "<p>Your savings ladder is still accruing and no accrual was marked as paid. "
            "You can retry with the manual payment option.</p>"
        )
    if event_key == "catch_arrived":
        return (
            f"<p>{payload.get('message') or f'{product} has landed'}.</p>"
            "<p>Complete your booking to claim your reserved catch before anyone else.</p>"
        )
    if event_key == "booking_confirmed":
        ref = payload.get("reference") or ""
        amount = payload.get("amount")
        date = payload.get("date") or ""
        slot = payload.get("slot") or "6:00 AM"
        line = f"<p>Delivery: {date} by {slot}.</p>" if date else ""
        paid = f"<p>Amount paid: \u20b9{amount}.</p>" if amount else ""
        return (
            f"<p>Your order{f' {ref}' if ref else ''} for <strong>{product}</strong> is confirmed.</p>"
            f"{line}{paid}<p>We'll send another note the moment it's ready.</p>"
        )
    if event_key == "booking_ready":
        return f"<p>Your <strong>{product}</strong> is ready for pickup at the 6 AM tide.</p>"
    if event_key == "booking_delivered":
        return f"<p>Your <strong>{product}</strong> has been delivered. Enjoy the feast!</p>"
    return f"<p>{payload.get('message') or 'An update from Meenamma.'}</p>"


def render_email(event_key: str, payload: dict):
    """Return (subject, html_body) for an outbox event payload."""
    name = payload.get("name") or "there"
    product = payload.get("product") or "your catch"
    subject = SUBJECTS.get(event_key, "An update from Meenamma")
    greeting = f"<p>Vanakkam, {name}.</p>"
    body = _body(event_key, payload, product)
    html = (
        '<div style="font-family:Georgia,serif;color:#4A1C17;max-width:560px">'
        f"{greeting}{body}"
        '<p style="color:#8a6d3b;font-size:12px">\u2014 Meenamma \u00b7 fresh from the dawn boats</p>'
        "</div>"
    )
    return subject, html


def send_email(to: str, subject: str, html: str):
    """Send via Resend. Returns the httpx response, or None when unconfigured."""
    key = os.environ.get("RESEND_API_KEY")
    if not key:
        return None
    resp = httpx.post(
        RESEND_ENDPOINT,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json={"from": EMAIL_FROM, "to": [to], "subject": subject, "html": html},
        timeout=15,
    )
    resp.raise_for_status()
    return resp


def _whatsapp_text(event_key: str, payload: dict, product: str) -> str:
    """Return the plain-text WhatsApp notification message."""
    name = payload.get("name") or "there"
    amount = payload.get("amount") or 0
    
    if event_key == "autopay_predebit":
        debit_date = payload.get("debit_date") or "tomorrow"
        return f"Vanakkam {name}! Meenamma here. Just a quick heads-up: your daily savings deposit of \u20b9{amount} will be debited on {debit_date}. Keep your UPI account active for your weekend catch! \ud83c\udf0a"
        
    if event_key == "autopay_dunning":
        return f"Hey {name}! Your unsettled kudam balance is \u20b9{amount}. It is above the authorized limit, so we did not attempt a debit. Please pay manual balance in the app: https://meenamma.org/dashboard"
        
    if event_key in ("autopay_payment_failed", "autopay_update_failed"):
        return f"Aiyo {name}! We couldn't process your daily deposit of \u20b9{amount}. Complete it manually here to keep your savings streak active: https://meenamma.org/dashboard"
        
    if event_key == "catch_arrived":
        msg = payload.get("message") or f"{product} has landed"
        return f"Fresh Landing Alert! \ud83d\udea8 {msg}. Claim yours now using your Kudam balance: https://meenamma.org/market"
        
    if event_key == "booking_confirmed":
        ref = f" {payload.get('reference')}" if payload.get("reference") else ""
        date = payload.get("date") or ""
        slot = payload.get("slot") or "6:00 AM"
        delivery_info = f" Delivery: {date} by {slot}." if date else ""
        payment_info = f" Value paid: \u20b9{amount}." if amount else ""
        return f"Vanakkam {name}! Your order{ref} for {product} is confirmed.{delivery_info}{payment_info} We'll alert you when it's ready!"
        
    if event_key == "booking_ready":
        return f"Your {product} is ready for pickup at the 6 AM tide! \ud83d\udc1f"
        
    if event_key == "booking_delivered":
        return f"Your {product} has been delivered. Enjoy the feast! \ud83c\udf0a"
        
    return payload.get("message") or "An update from Meenamma."


def send_whatsapp(to: str, text: str):
    """Send via the Baileys WhatsApp microservice sidecar. Returns response or None."""
    try:
        resp = httpx.post(
            "http://localhost:4000/send-message",
            json={"to": to, "text": text},
            timeout=10
        )
        return resp
    except Exception as e:
        print(f"Failed to send WhatsApp message to {to}: {e}")
        return None


def queue_notification(sb, *, aggregate_type, aggregate_id, event_key,
                       idempotency_key, payload) -> bool:
    """Insert an outbox row; returns False on duplicate/DB failure (never raises)."""
    try:
        sb.table("notification_outbox").insert({
            "aggregate_type": aggregate_type, "aggregate_id": aggregate_id,
            "event_key": event_key, "idempotency_key": idempotency_key,
            "payload": payload,
        }).execute()
        return True
    except Exception:
        return False


def drain_notification_outbox(sb, limit=20):
    """Send due, unprocessed outbox rows. Returns {'sent','failed'} counts.

    Rows without a recipient are failed (attempt counter bumped); rows whose
    send raises are failed too, capped at MAX_ATTEMPTS. When RESEND_API_KEY is
    unset the drain is a no-op and every row stays queued.
    """
    now = datetime.now(timezone.utc).isoformat()
    rows = (sb.table("notification_outbox")
            .select("*")
            .is_("processed_at", "null")
            .lte("available_at", now)
            .order("created_at", desc=False)
            .limit(limit)
            .execute().data)
    sent = failed = 0
    for row in rows:
        if (row.get("attempt_count") or 0) >= MAX_ATTEMPTS:
            continue
        payload = row.get("payload") or {}
        email = payload.get("email")
        phone = payload.get("phone")
        
        if not email and not phone:
            failed += 1
            continue
            
        email_sent = False
        whatsapp_sent = False
        email_configured = True
        
        try:
            product = payload.get("product") or "your catch"
            # 1. Try sending email if email address present
            if email:
                subject, html = render_email(row["event_key"], payload)
                resp = send_email(email, subject, html)
                if resp is not None:
                    email_sent = True
                else:
                    email_configured = False # Resend API key missing
                    
            # 2. Try sending WhatsApp if phone number present
            if phone:
                text = _whatsapp_text(row["event_key"], payload, product)
                resp = send_whatsapp(phone, text)
                if resp is not None and resp.status_code == 200:
                    whatsapp_sent = True
            
            # If we successfully sent at least one channel, mark as processed.
            if email_sent or whatsapp_sent:
                sb.table("notification_outbox").update({"processed_at": now}) \
                    .eq("id", row["id"]).execute()
                sent += 1
            elif not email_configured and not phone:
                continue # leave queued for when email is configured
            else:
                raise RuntimeError("Failed to send on all available channels")
                
        except Exception as e:
            failed += 1
            sb.table("notification_outbox").update({
                "attempt_count": (row.get("attempt_count") or 0) + 1,
                "last_error": str(e)[:500],
            }).eq("id", row["id"]).execute()
            
    return {"sent": sent, "failed": failed}
