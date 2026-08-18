"""Load local runtime configuration with an explicit environment override."""

from pathlib import Path
import os
from typing import Optional

from dotenv import load_dotenv


REPO_ROOT = Path(__file__).resolve().parents[1]
_loaded_env: Optional[Path] = None


def _env_path(value: str) -> Path:
    path = Path(value).expanduser()
    return path if path.is_absolute() else REPO_ROOT / path


def load_runtime_env() -> Optional[Path]:
    """Load the selected env file while keeping already-exported values authoritative.

    Local development defaults to ``.env.local`` and falls back to ``.env``. Set
    ``MEENAMMA_ENV_FILE`` to point at a specific environment file.
    """
    global _loaded_env
    if _loaded_env is not None:
        return _loaded_env

    selected = os.environ.get("MEENAMMA_ENV_FILE")
    if selected:
        path = _env_path(selected)
        load_dotenv(path, override=False)
        _loaded_env = path
        return path

    loaded = None
    for path in (REPO_ROOT / ".env.local", REPO_ROOT / ".env"):
        if path.exists():
            load_dotenv(path, override=False)
            loaded = path
    _loaded_env = loaded
    return loaded
