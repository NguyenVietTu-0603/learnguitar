from pathlib import Path
from uuid import uuid4


def ensure_directory(path: str) -> None:
    Path(path).mkdir(parents=True, exist_ok=True)


def allowed_file(filename: str, allowed_extensions: set[str]) -> bool:
    if not filename or "." not in filename:
        return False
    extension = filename.rsplit(".", 1)[1].lower()
    return extension in allowed_extensions


def build_safe_filename(original_name: str) -> str:
    extension = original_name.rsplit(".", 1)[1].lower()
    return f"{uuid4().hex}.{extension}"
