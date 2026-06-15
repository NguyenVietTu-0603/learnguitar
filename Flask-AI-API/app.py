import os

from flask import Flask, send_from_directory
from flask_cors import CORS

from config import Config
from routes import health_bp, tab_bp
from services import DetectionVisualizer, DetectorService, JSONBuilder, LineProcessor, PostProcessor, TabRenderer
from utils import ensure_directory


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)

    ensure_directory(app.config["UPLOAD_FOLDER"])
    ensure_directory(app.config["OUTPUT_FOLDER"])

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
