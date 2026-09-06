import pytest
from datetime import datetime, timezone
from api.referrals import (
    intern_milestone_status,
    partner_commission_paise,
    shopper_royalty_points,
    make_referral_code,
    make_student_serial,
    INTERN_TIERS,
)
from api.index import PartnerPayoutIn, LeadSubmissionIn, profile_updates, ProfileIn


def test_shopper_royalty_points():
    assert shopper_royalty_points(0) == 0
    assert shopper_royalty_points(9900) == 0  # < ₹100
    assert shopper_royalty_points(10000) == 1  # ₹100 = 1 pt
    assert shopper_royalty_points(550000) == 55  # ₹5,500 = 55 pts


def test_partner_commission_calculation():
    # 5% commission on general fish orders
    assert partner_commission_paise(100000) == 5000  # ₹1000 order = ₹50 commission
    assert partner_commission_paise(200000) == 10000  # ₹2000 order = ₹100 commission
    # ₹50 fixed on Kudam subscription activation
    assert partner_commission_paise(0, is_subscription=True) == 5000


def test_intern_milestone_tiers():
    # 0 verified leads -> Tier 1 target
    status_0 = intern_milestone_status(0)
    assert status_0["current_tier"] is None
    assert status_0["next_tier"]["tier"] == 1
    assert status_0["unlocked_stipend_inr"] == 0
    assert status_0["progress_pct"] == 0

    # 10 verified leads -> Tier 1 completed
    status_10 = intern_milestone_status(10)
    assert status_10["current_tier"]["tier"] == 1
    assert status_10["unlocked_stipend_inr"] == 500
    assert status_10["next_tier"]["tier"] == 2

    # 25 verified leads -> Tier 2 completed
    status_25 = intern_milestone_status(25)
    assert status_25["current_tier"]["tier"] == 2
    assert status_25["unlocked_stipend_inr"] == 1500

    # 50 verified leads -> Tier 3 completed
    status_50 = intern_milestone_status(50)
    assert status_50["current_tier"]["tier"] == 3
    assert status_50["unlocked_stipend_inr"] == 3500


def test_models_and_profile_updates():
    payout_req = PartnerPayoutIn(amount=500, payout_method="upi", payout_address="partner@okhdfcbank")
    assert payout_req.amount == 500
    assert payout_req.payout_address == "partner@okhdfcbank"

    lead = LeadSubmissionIn(lead_name="Karthik", lead_phone="9876543210", lead_pincode="600028", locality="Mylapore")
    assert lead.lead_name == "Karthik"
    assert lead.interest_type == "kudam_savings"

    upd = profile_updates(ProfileIn(
        name="Meena Partner",
        upi_id="meena@upi",
        payout_phone="9988776655",
        bank_name="HDFC",
        bank_account_no="1234567890",
        bank_ifsc="HDFC0001234",
        account_type="partner_earner"
    ))
    assert upd["display_name"] == "Meena Partner"
    assert upd["upi_id"] == "meena@upi"
    assert upd["payout_phone"] == "9988776655"
    assert upd["bank_account_no"] == "1234567890"
    assert upd["account_type"] == "partner_earner"
