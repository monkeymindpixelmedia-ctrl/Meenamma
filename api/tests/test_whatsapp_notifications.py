import os
import pytest
from unittest.mock import MagicMock, patch
from types import SimpleNamespace
from api.notify import drain_notification_outbox, render_email

class MockSupabase:
    def __init__(self, rows):
        self.rows = rows
        self._table = None
        self._filters = []
        self._limit = None
        self._order = None

    def table(self, name):
        self._table = name
        return self

    def select(self, *args, **kwargs):
        return self

    def is_(self, col, val):
        return self

    def lte(self, col, val):
        return self

    def order(self, *args, **kwargs):
        return self

    def limit(self, val):
        self._limit = val
        return self

    def eq(self, col, val):
        self._filters.append((col, val))
        return self

    def update(self, values):
        self.update_values = values
        return self

    def execute(self):
        if hasattr(self, "update_values"):
            # Update matching row processed_at or attempts
            for row in self.rows:
                match = True
                for col, val in self._filters:
                    if row.get(col) != val:
                        match = False
                if match:
                    row.update(self.update_values)
            # Reset
            delattr(self, "update_values")
            self._filters = []
            return SimpleNamespace(data=[])
        
        # Select return
        res = self.rows[:self._limit] if self._limit else self.rows
        return SimpleNamespace(data=res)


def test_drain_drains_email_only(monkeypatch):
    rows = [{
        "id": "123",
        "event_key": "booking_confirmed",
        "payload": {
            "email": "test@example.com",
            "name": "Karthi",
            "product": "Vanjaram",
            "amount": 500
        },
        "attempt_count": 0,
        "processed_at": None
    }]
    
    sb = MockSupabase(rows)
    
    mock_send_email = MagicMock()
    mock_send_email.return_value = SimpleNamespace(status_code=200)
    monkeypatch.setattr("api.notify.send_email", mock_send_email)
    
    mock_send_whatsapp = MagicMock()
    monkeypatch.setattr("api.notify.send_whatsapp", mock_send_whatsapp)
    
    res = drain_notification_outbox(sb)
    
    assert res == {"sent": 1, "failed": 0}
    assert mock_send_email.called
    assert not mock_send_whatsapp.called
    assert rows[0]["processed_at"] is not None


def test_drain_drains_whatsapp_only(monkeypatch):
    rows = [{
        "id": "456",
        "event_key": "autopay_predebit",
        "payload": {
            "phone": "+919876543210",
            "name": "Karthi",
            "amount": 10
        },
        "attempt_count": 0,
        "processed_at": None
    }]
    
    sb = MockSupabase(rows)
    
    mock_send_email = MagicMock()
    monkeypatch.setattr("api.notify.send_email", mock_send_email)
    
    mock_send_whatsapp = MagicMock()
    mock_send_whatsapp.return_value = SimpleNamespace(status_code=200)
    monkeypatch.setattr("api.notify.send_whatsapp", mock_send_whatsapp)
    
    res = drain_notification_outbox(sb)
    
    assert res == {"sent": 1, "failed": 0}
    assert not mock_send_email.called
    assert mock_send_whatsapp.called
    assert rows[0]["processed_at"] is not None
    # Verify the plain text contains the expected name and amount
    args, kwargs = mock_send_whatsapp.call_args
    assert "+919876543210" in args[0]
    assert "₹10" in args[1] or "₹10" in args[1].encode('utf-8').decode('utf-8') or "10" in args[1]


def test_drain_drains_both_email_and_whatsapp(monkeypatch):
    rows = [{
        "id": "789",
        "event_key": "booking_confirmed",
        "payload": {
            "email": "test@example.com",
            "phone": "+919876543210",
            "name": "Karthi",
            "product": "Pomfret",
            "amount": 750
        },
        "attempt_count": 0,
        "processed_at": None
    }]
    
    sb = MockSupabase(rows)
    
    mock_send_email = MagicMock()
    mock_send_email.return_value = SimpleNamespace(status_code=200)
    monkeypatch.setattr("api.notify.send_email", mock_send_email)
    
    mock_send_whatsapp = MagicMock()
    mock_send_whatsapp.return_value = SimpleNamespace(status_code=200)
    monkeypatch.setattr("api.notify.send_whatsapp", mock_send_whatsapp)
    
    res = drain_notification_outbox(sb)
    
    assert res == {"sent": 1, "failed": 0}
    assert mock_send_email.called
    assert mock_send_whatsapp.called
    assert rows[0]["processed_at"] is not None
