import os


class Config:
    APP_NAME = os.getenv("APP_NAME", "Flask AI API")
    API_PREFIX = os.getenv("API_PREFIX", "/api")
    DEBUG = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    JSON_SORT_KEYS = False

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    OUTPUT_FOLDER = os.path.join(BASE_DIR, "outputs")
    MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(BASE_DIR, "best.pt"))
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
