from datetime import datetime, timezone, timedelta
from api.referrals import (
    STUDENT_CYCLE_DAYS,
    STUDENT_TARGET_AMOUNT,
    STUDENT_TARGET_PAISE,
    make_student_serial,
    student_savings_milestone,
)


def test_make_student_serial_formatting():
    serial = make_student_serial("abcd1234-ef56-7890-abcd-1234567890ab")
    assert serial.startswith("MNM-STU-")
    assert len(serial) == 12
    assert serial == "MNM-STU-ABCD"


def test_student_savings_milestone_target_and_days():
    start = datetime(2026, 1, 1, tzinfo=timezone.utc)
    current = datetime(2026, 1, 21, tzinfo=timezone.utc)  # 20 days elapsed

    milestone = student_savings_milestone(start, total_saved_paise=250000, now=current)
    assert milestone["cycle_days"] == 60
    assert milestone["days_elapsed"] == 20
    assert milestone["days_remaining"] == 40
    assert milestone["cycle_active"] is True
    assert milestone["target_amount"] == 5050
    assert milestone["saved_amount"] == 2500
    assert milestone["is_milestone_completed"] is False
    assert milestone["progress_percent"] == 50
    assert milestone["commission_eligible"] is True


def test_student_savings_milestone_completed():
    start = datetime(2026, 1, 1, tzinfo=timezone.utc)
    current = datetime(2026, 2, 1, tzinfo=timezone.utc)

    milestone = student_savings_milestone(start, total_saved_paise=505000, now=current)
    assert milestone["saved_amount"] == 5050
    assert milestone["is_milestone_completed"] is True
    assert milestone["progress_percent"] == 100
    assert milestone["commission_eligible"] is True


def test_student_savings_milestone_expired():
    start = datetime(2026, 1, 1, tzinfo=timezone.utc)
    current = datetime(2026, 3, 15, tzinfo=timezone.utc)  # > 60 days

    milestone = student_savings_milestone(start, total_saved_paise=100000, now=current)
    assert milestone["days_remaining"] == 0
    assert milestone["cycle_active"] is False
    assert milestone["is_milestone_completed"] is False
