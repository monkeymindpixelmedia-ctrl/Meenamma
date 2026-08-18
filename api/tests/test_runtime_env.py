from pathlib import Path

from api import runtime_env


def test_explicit_env_file_selects_a_different_auth_environment(tmp_path, monkeypatch):
    selected = tmp_path / ".env.production.local"
    selected.write_text(
        "NEXT_PUBLIC_SUPABASE_URL=https://prod.example.test\n",
        encoding="utf-8",
    )
    monkeypatch.delenv("NEXT_PUBLIC_SUPABASE_URL", raising=False)
    monkeypatch.setenv("MEENAMMA_ENV_FILE", str(selected))

    loaded = runtime_env.load_runtime_env()

    assert loaded == Path(selected)
    assert runtime_env.os.environ["NEXT_PUBLIC_SUPABASE_URL"] == "https://prod.example.test"


def test_exported_values_are_not_overwritten_by_env_file(tmp_path, monkeypatch):
    selected = tmp_path / ".env"
    selected.write_text(
        "NEXT_PUBLIC_SUPABASE_URL=https://file.example.test\n",
        encoding="utf-8",
    )
    monkeypatch.setenv("MEENAMMA_ENV_FILE", str(selected))
    monkeypatch.setenv("NEXT_PUBLIC_SUPABASE_URL", "https://exported.example.test")

    runtime_env.load_runtime_env()

    assert runtime_env.os.environ["NEXT_PUBLIC_SUPABASE_URL"] == "https://exported.example.test"
