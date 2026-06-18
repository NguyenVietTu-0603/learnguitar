import os

from flask import Flask, send_from_directory
from flask_cors import CORS

from config import Config
from routes import audio_bp, health_bp, tab_bp
from services import (
    AudioService,
    DetectionVisualizer,
    DetectorService,
    JSONBuilder,
    LineProcessor,
    PostProcessor,
    TabRenderer,
)
from utils import ensure_directory


MODEL_DOWNLOAD_URL = os.getenv(
    "MODEL_DOWNLOAD_URL",
    "https://github.com/NguyenVietTu-0603/learnguitar/releases/download/v1.0.0/best.pt",
)


def _validate_model_file(path: str) -> None:
    """Raise if `path` doesn't look like a real PyTorch checkpoint.

    Catches the common case where a download returned an HTML error page
    (e.g. 401/404) and saved it as `best.pt`. Real .pt files start with the
    ZIP magic bytes `PK\x03\x04`; HTML responses start with `<`.
    """
    with open(path, "rb") as f:
        head = f.read(4)
    if head[:2] != b"PK":
        with open(path, "rb") as f:
            preview = f.read(200)
        raise RuntimeError(
            f"Model file at {path!r} is not a valid PyTorch checkpoint "
            f"(magic bytes: {head!r}). First bytes: {preview[:120]!r}. "
            "The download URL likely returned an error page."
        )


def ensure_model_file(model_path: str) -> None:
    """If model_path is missing or still a Git LFS pointer, download the real file."""
    def _is_lfs_pointer(path: str) -> bool:
        try:
            with open(path, "rb") as f:
                head = f.read(64)
            return head.startswith(b"version https://git-lfs")
        except OSError:
            return False

    if model_path and os.path.exists(model_path) and not _is_lfs_pointer(model_path):
        _validate_model_file(model_path)
        return

    if not MODEL_DOWNLOAD_URL:
        raise RuntimeError(
            f"Model file missing at {model_path!r} and MODEL_DOWNLOAD_URL is not set."
        )

    os.makedirs(os.path.dirname(model_path) or ".", exist_ok=True)
    print(f"[startup] Downloading model from {MODEL_DOWNLOAD_URL} -> {model_path}")

    download_url = MODEL_DOWNLOAD_URL
    if "drive.google.com" in download_url:
        try:
            import gdown  # type: ignore
        except ImportError:
            print("[startup] gdown not installed, installing...")
            import subprocess
            subprocess.run(
                ["pip", "install", "--quiet", "gdown"],
                check=True,
            )
            import gdown  # type: ignore
        gdown.download(download_url, model_path, quiet=False)
    else:
        import urllib.request
        req = urllib.request.Request(
            download_url,
            headers={
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/octet-stream,*/*",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=600) as resp, open(model_path, "wb") as out:
                total = int(resp.headers.get("Content-Length") or 0)
                read = 0
                chunk = 1024 * 1024
                while True:
                    block = resp.read(chunk)
                    if not block:
                        break
                    out.write(block)
                    read += len(block)
                    if total:
                        print(f"[startup] {read/1e6:.1f}/{total/1e6:.1f} MB", end="\r", flush=True)
        except Exception as exc:
            if os.path.exists(model_path):
                os.remove(model_path)
            raise RuntimeError(
                f"Failed to download model from {download_url}: {exc}"
            ) from exc

    size_mb = os.path.getsize(model_path) / 1e6
    print(f"[startup] Model downloaded: {size_mb:.1f} MB")
    _validate_model_file(model_path)


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    cors_origins_env = os.getenv("CORS_ORIGINS", "*").strip()
    if cors_origins_env and cors_origins_env != "*":
        origins_list = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
        CORS(app, resources={r"/*": {"origins": origins_list}})
    else:
        CORS(app)

    ensure_directory(app.config["UPLOAD_FOLDER"])
    ensure_directory(app.config["OUTPUT_FOLDER"])

    ensure_model_file(app.config["MODEL_PATH"])
    detector = DetectorService(app.config["MODEL_PATH"])
    detector.load_model()
    line_processor = LineProcessor()
    post_processor = PostProcessor(line_processor)
    json_builder = JSONBuilder()
    renderer = TabRenderer()
    visualizer = DetectionVisualizer()
    audio_service = AudioService(
        output_dir=app.config["OUTPUT_FOLDER"],
        sample_rate=44100,
    )

    app.extensions["services"] = {
        "detector": detector,
        "line_processor": line_processor,
        "post_processor": post_processor,
        "json_builder": json_builder,
        "renderer": renderer,
        "visualizer": visualizer,
        "audio": audio_service,
    }

    api_prefix = app.config["API_PREFIX"]
    app.register_blueprint(health_bp)
    app.register_blueprint(tab_bp, url_prefix=api_prefix)
    app.register_blueprint(audio_bp, url_prefix=api_prefix)

    @app.get("/uploads/<path:filename>")
    def serve_upload(filename: str):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    @app.get("/outputs/<path:filename>")
    def serve_output(filename: str):
        return send_from_directory(app.config["OUTPUT_FOLDER"], filename)

    @app.get("/")
    def root():
        return {
            "service": app.config["APP_NAME"],
            "status": "running",
            "api_prefix": api_prefix,
            "model_path": app.config["MODEL_PATH"],
            "endpoints": [
                "/health",
                f"{api_prefix}/tab/detect",
                f"{api_prefix}/tab/render",
                f"{api_prefix}/tab/save",
                f"{api_prefix}/tab/<tab_id>",
                f"{api_prefix}/audio/play",
                f"{api_prefix}/audio/play-server",
                f"{api_prefix}/audio/preview",
                f"{api_prefix}/audio/info",
            ],
        }

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.getenv("PORT", os.getenv("FLASK_RUN_PORT", "5001")))
    app.run(host="0.0.0.0", port=port, debug=app.config["DEBUG"])
