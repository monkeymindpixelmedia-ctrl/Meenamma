"""Idempotent Supabase seed: admin + demo users, roles, demo kudam, 15 products."""
from dotenv import load_dotenv
load_dotenv()

import os
import re
import uuid
from supabase import create_client

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

IMG = "https://static.prod-images.emergentagent.com/jobs/950ac656-d06c-4ab1-9af2-57dae3ef9785/images"

PRODUCTS = [
    ("Vanjaram", "வஞ்சரம்", 1100, "https://images.unsplash.com/photo-1611214774777-3d997a9d0e35?w=800&q=80",
     "Kasimedu Harbour, Chennai",
     "Line-caught at dawn by the Karuppan family, third-generation fishers of Kasimedu. The seer fish is the king of Tamil feasts.",
     "Iced within 20 minutes of catch. Never frozen."),
    ("Sankara", "சங்கரா", 480, "https://images.unsplash.com/photo-1566575071977-42fab7fae5c8?w=800&q=80",
     "Nagapattinam Coast",
     "Red snapper hauled from the reef beds of Nagapattinam, where the Cauvery meets the Bay of Bengal.",
     "Sorted by hand, gill-checked for freshness."),
    ("Vaaval", "வாவல்", 850, "https://images.unsplash.com/photo-1572123866325-6f15f82c993d?w=800&q=80",
     "Rameswaram Waters",
     "Silver pomfret from the sacred waters of Rameswaram, prized for Sunday kuzhambu across Tamil homes.",
     "Chilled seawater immersion, delivered same day."),
    ("Iral", "இறால்", 650, "https://images.unsplash.com/photo-1578069744397-2f3942a02a7b?w=800&q=80",
     "Pulicat Lake",
     "Tiger prawns from the brackish lagoons of Pulicat, netted by hand the way it has been done for 400 years.",
     "Live-sorted, heads intact, flash-iced."),
    ("Nethili", "நெத்திலி", 320, "https://images.unsplash.com/photo-1634932515818-7f9292c4e149?w=800&q=80",
     "Kanyakumari Shore",
     "Anchovies scooped from moonlit shore-seines at Kanyakumari, where three oceans meet.",
     "Sun-shade dried option available on request."),
    ("Kanava", "கணவா", 550, "https://images.unsplash.com/photo-1703756292793-287f082d3a45?w=800&q=80",
     "Tuticorin Pearl Coast",
     "Squid jigged at night off the pearl coast of Tuticorin, tender enough for the softest thokku.",
     "Cleaned on request, ink sacs preserved."),
    ("Koduva", "கொடுவா", 780, f"{IMG}/c9e7262a39791b86c4fb1ca5a351948e7860723026fe474ff79a56af8d02b8c1.jpeg",
     "Ennore Creek",
     "Asian sea bass from the tidal creeks of Ennore — the fish Chennai grandmothers demand for a newborn's first feast.",
     "Kept swimming till the auction bell. Iced whole."),
    ("Paarai", "பாறை", 520, f"{IMG}/6339f86fa87e906b39f49110d019f76ed580eaeadff3d95767088658becb0f2d.jpeg",
     "Cuddalore Coast",
     "Malabar trevally from the rock beds off Cuddalore, firm-fleshed and made for a fiery varuval.",
     "Auction-graded, delivered scales-on."),
    ("Nandu", "நண்டு", 700, f"{IMG}/66b45280c98b4cd199f18a0712fe2d68acfd83fab200144aac4e28a23991fa78.jpeg",
     "Muttukadu Backwaters",
     "Mud crabs trapped at slack tide in the Muttukadu backwaters — heavy, meaty, tied by hand in jute.",
     "Sold live, tied and graded by weight."),
    ("Mathi", "மத்தி", 260, f"{IMG}/585825f622d1525859a694f96e6746e4f909e4d63dcf08e91a18a8d03da0ca85.jpeg",
     "Chennai Marina Shore",
     "Oil sardines netted before sunrise off the Marina — the humble fish that built the Tamil coast.",
     "Basket-iced within minutes. Best fried same day."),
    ("Ayila", "அயிலை", 380, f"{IMG}/e4679dc21db97c30c40f312ea1f268b287bc7c3ea40ed276098e247edb6c65b8.jpeg",
     "Mahabalipuram Waters",
     "Indian mackerel from the shore boats of Mahabalipuram, striped backs still shining from the sea.",
     "Row-packed on banana leaf and ice."),
    ("Kaala", "காளா", 950, f"{IMG}/c2aa9d02a8b6b5c31aa3af8b91c804f56f29fbd94ec6871a68166ebad9a837a3.jpeg",
     "Pazhaverkadu Estuary",
     "Indian threadfin — the wedding fish. One Kaala on the table announces the family has arrived.",
     "Single-fish auction lots. Iced on teak."),
    ("Sura", "சுறா", 420, f"{IMG}/a898f01ddb1ef99f9bdbf857bb192da357b6c90fe92eba2a4bdd3d436b1ffe2b.jpeg",
     "Nagoor Coast",
     "Baby shark cut for puttu — the postpartum strength dish Tamil mothers have trusted for generations.",
     "Steaked on request, skin removed."),
    ("Kelanga", "கிளங்கா", 340, f"{IMG}/935af8335362171fe4ad0e95bbcb86cecf5efadf201537b51c67c40430d1bb63.jpeg",
     "Kovalam Shore",
     "Silver whiting from the surf line at Kovalam, so tender it is the first fish given to children.",
     "Shore-seine catch. Cleaned and iced whole."),
    ("Ooli", "ஊளி", 460, f"{IMG}/b1a12db7b125409d775a020febad7b4dcd46d7a5f986c064504d068462a7b462.jpeg",
     "Point Calimere",
     "Barracuda speared past the Point Calimere sandbanks — a torpedo of firm white flesh for the grill.",
     "Long-lined, bled at sea, iced whole."),
]


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def ensure_user(email, password, name):
    rows = sb.table("profiles").select("id").eq("email", email).execute().data
    if rows:
        uid = rows[0]["id"]
        sb.auth.admin.update_user_by_id(uid, {"password": password})
        return uid
    res = sb.auth.admin.create_user({"email": email, "password": password,
                                     "email_confirm": True, "user_metadata": {"name": name}})
    return res.user.id


def main():
    admin_id = ensure_user(os.environ["ADMIN_EMAIL"], os.environ["ADMIN_PASSWORD"], "Meenamma Admin")
    sb.table("profiles").update({"display_name": "Meenamma Admin"}).eq("id", admin_id).execute()
    existing = sb.table("staff_role_assignments").select("id").eq("profile_id", admin_id) \
        .eq("role", "ops_admin").is_("revoked_at", "null").execute().data
    if not existing:
        sb.table("staff_role_assignments").insert(
            {"profile_id": admin_id, "role": "ops_admin", "granted_by": admin_id}).execute()
    print("admin:", admin_id)

    demo_id = ensure_user("demo@meenamma.in", "meenamma2026", "Demo Family")
    sb.table("profiles").update({"display_name": "Demo Family", "daily_plan": 5,
                                 "pincode": "600013", "upi_id": "demofamily@upi"}).eq("id", demo_id).execute()
    if not sb.table("kudams").select("id").eq("profile_id", demo_id).execute().data:
        sb.table("kudams").insert({"profile_id": demo_id, "name": "Sunday Feast",
                                   "goal_paise": 50000, "saved_paise": 33000}).execute()
    print("demo:", demo_id)

    cut = sb.table("cuts").select("id").eq("code", "whole_cleaned").execute().data
    cut_id = cut[0]["id"] if cut else sb.table("cuts").insert(
        {"code": "whole_cleaned", "slug": "whole-cleaned",
         "display_en": {"name": "Whole · Cleaned"}}).execute().data[0]["id"]

    for name, tamil, price, image, origin, story, handling in PRODUCTS:
        slug = slugify(name)
        sp = sb.table("species").select("id").eq("slug", slug).execute().data
        sp_id = sp[0]["id"] if sp else sb.table("species").insert(
            {"canonical_name": name, "slug": slug, "status": "published",
             "display_en": {"name": name}, "display_ta": {"name": tamil}}).execute().data[0]["id"]
        exists = sb.table("products").select("id").eq("species_id", sp_id).neq("status", "archived").execute().data
        if exists:
            continue
        sb.table("products").insert({
            "species_id": sp_id, "cut_id": cut_id,
            "slug": f"{slug}-{uuid.uuid4().hex[:6]}", "sku": f"MNM-{uuid.uuid4().hex[:8].upper()}",
            "status": "published", "net_weight_grams": 1000, "base_price_paise": price * 100,
            "display_en": {"name": name, "tamil_name": tamil, "origin": origin,
                           "story": story, "handling": handling},
            "media": [{"url": image}]}).execute()
        print("product:", name)
    print("seed complete")


if __name__ == "__main__":
    main()
