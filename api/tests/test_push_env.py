import importlib
import subprocess
import sys


def test_env_local_overrides_env_and_only_supported_variables_are_mapped(tmp_path):
    push_env = importlib.import_module("push_env")
    (tmp_path / ".env").write_text(
        "\n".join(
            (
                "NEXT_PUBLIC_SUPABASE_URL=https://base.example",
                "NEXT_PUBLIC_SUPABASE_ANON_KEY=base-anon",
                "SUPABASE_SERVICE_ROLE_KEY=base-service-role",
                "RAZORPAY_KEY_ID=rzp_test_base",
                "RAZORPAY_KEY_SECRET=base-secret",
                "UNSUPPORTED_VALUE=must-not-be-synced",
            )
        ),
        encoding="utf-8",
    )
    (tmp_path / ".env.local").write_text(
        "\n".join(
            (
                "NEXT_PUBLIC_SUPABASE_URL=https://local.example",
                "RAZORPAY_KEY_ID=rzp_live_local",
                "RAZORPAY_KEY_SECRET=local-live-secret",
                "UNSUPPORTED_LOCAL_VALUE=must-also-be-ignored",
            )
        ),
        encoding="utf-8",
    )

    values = push_env.load_deployment_variables(tmp_path)

    assert values == {
        "SUPABASE_URL": "https://local.example",
        "REACT_APP_SUPABASE_URL": "https://local.example",
        "REACT_APP_SUPABASE_ANON_KEY": "base-anon",
        "SUPABASE_SERVICE_ROLE_KEY": "base-service-role",
        "RAZORPAY_KEY_ID": "rzp_live_local",
        "RAZORPAY_KEY_SECRET": "local-live-secret",
    }


def test_live_razorpay_values_are_overwritten_in_every_vercel_target_without_logging(
    monkeypatch, capsys
):
    push_env = importlib.import_module("push_env")
    live_values = {
        "RAZORPAY_KEY_ID": "rzp_live_synthetic_id",
        "RAZORPAY_KEY_SECRET": "synthetic-live-secret",
    }
    calls = []

    def fake_run(command, **kwargs):
        calls.append((command, kwargs))

    monkeypatch.setattr(push_env.subprocess, "run", fake_run)

    push_env.sync_to_vercel(live_values)

    assert len(calls) == 6
    assert {
        (command[4], command[5], kwargs["input"])
        for command, kwargs in calls
    } == {
        (name, target, value)
        for target in ("production", "preview", "development")
        for name, value in live_values.items()
    }
    for command, kwargs in calls:
        assert command[:4] == ["npx.cmd", "vercel", "env", "add"]
        assert command[-1] == "--force"
        assert kwargs["text"] is True
        assert kwargs["check"] is True

    output = capsys.readouterr().out
    assert live_values["RAZORPAY_KEY_ID"] not in output
    assert live_values["RAZORPAY_KEY_SECRET"] not in output


def test_importing_push_env_has_no_file_or_subprocess_side_effect(monkeypatch, tmp_path):
    calls = []
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(subprocess, "run", lambda *args, **kwargs: calls.append((args, kwargs)))
    monkeypatch.setattr(subprocess, "Popen", lambda *args, **kwargs: calls.append((args, kwargs)))
    sys.modules.pop("push_env", None)

    importlib.import_module("push_env")

    assert calls == []
