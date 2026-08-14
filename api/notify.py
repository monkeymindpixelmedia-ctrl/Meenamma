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
    "catch_arrived": "Your reserved catch has landed",
    "booking_confirmed": "Your catch is confirmed",
    "booking_ready": "Your catch is ready",
    "booking_delivered": "Your catch has been delivered",
}


def _body(event_key: str, payload: dict, product: str) -> str:
    """Inner HTML for an outbox event (sibling ifs keep nesting flat)."""
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
        email = (row.get("payload") or {}).get("email")
        if not email:
            failed += 1
            continue
        try:
            subject, html = render_email(row["event_key"], row.get("payload") or {})
            if send_email(email, subject, html) is None:
                continue  # not configured — leave queued
            sb.table("notification_outbox").update({"processed_at": now}) \
                .eq("id", row["id"]).execute()
            sent += 1
        except Exception as e:
            failed += 1
            sb.table("notification_outbox").update({
                "attempt_count": (row.get("attempt_count") or 0) + 1,
                "last_error": str(e)[:500],
            }).eq("id", row["id"]).execute()
    return {"sent": sent, "failed": failed}
