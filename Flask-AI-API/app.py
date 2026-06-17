import os

from flask import Flask, send_from_directory
from flask_cors import CORS

from config import Config
from routes import health_bp, tab_bp
from services import DetectionVisualizer, DetectorService, JSONBuilder, LineProcessor, PostProcessor, TabRenderer
from utils import ensure_directory


MODEL_DOWNLOAD_URL = os.getenv(
    "MODEL_DOWNLOAD_URL",
    "https://huggingface.co/datasets/Pendulumn/GuitarModels/resolve/main/best.pt",
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
        return

    if not MODEL_DOWNLOAD_URL:
        raise RuntimeError(
            f"Model file missing at {model_path!r} and MODEL_DOWNLOAD_URL is not set."
        )

    os.makedirs(os.path.dirname(model_path) or ".", exist_ok=True)
    print(f"[startup] Downloading model from {MODEL_DOWNLOAD_URL} -> {model_path}")
    import re
    import urllib.parse
    import urllib.request
    import http.cookiejar

    download_url = MODEL_DOWNLOAD_URL
    if "drive.google.com" in download_url:
        m = re.search(r"/d/([\w-]+)", download_url) or re.search(r"id=([\w-]+)", download_url)
        if m:
            file_id = m.group(1)
            download_url = f"https://drive.google.com/uc?export=download&id={file_id}"

    cookie_jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))
    urllib.request.install_opener(opener)

    def _download(url: str, dst: str) -> None:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with opener.open(req, timeout=600) as resp:
            content_type = resp.headers.get("Content-Type", "")
            if "text/html" in content_type:
                html = resp.read().decode("utf-8", errors="ignore")
                confirm_match = re.search(r"confirm=([0-9A-Za-z_-]+)", html)
                if confirm_match:
                    confirm_token = confirm_match.group(1)
                    sep = "&" if "?" in url else "?"
                    url2 = f"{url}{sep}confirm={confirm_token}"
                    with opener.open(urllib.request.Request(url2, headers={"User-Agent": "Mozilla/5.0"}), timeout=600) as resp2:
                        _write_stream(resp2, dst)
                    return
                raise RuntimeError("Google Drive returned HTML without confirm token; please re-host the model.")
            _write_stream(resp, dst)

    def _write_stream(resp, dst: str) -> None:
        total = int(resp.headers.get("Content-Length") or 0)
        read = 0
        chunk = 1024 * 1024
        with open(dst, "wb") as out:
            while True:
                block = resp.read(chunk)
                if not block:
                    break
                out.write(block)
                read += len(block)
                if total:
                    print(f"[startup] {read/1e6:.1f}/{total/1e6:.1f} MB", end="\r", flush=True)

    _download(download_url, model_path)
    size_mb = os.path.getsize(model_path) / 1e6
    print(f"[startup] Model downloaded: {size_mb:.1f} MB")


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

    app.extensions["services"] = {
        "detector": detector,
        "line_processor": line_processor,
        "post_processor": post_processor,
        "json_builder": json_builder,
        "renderer": renderer,
        "visualizer": visualizer,
    }

    api_prefix = app.config["API_PREFIX"]
    app.register_blueprint(health_bp)
    app.register_blueprint(tab_bp, url_prefix=api_prefix)

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
            ],
        }

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.getenv("PORT", os.getenv("FLASK_RUN_PORT", "5001")))
    app.run(host="0.0.0.0", port=port, debug=app.config["DEBUG"])
