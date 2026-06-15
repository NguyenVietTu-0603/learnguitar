import pytest
from utils import (
    allowed_file,
    build_safe_filename,
    ensure_directory,
    error_response,
    success_response,
)
from pathlib import Path


class TestFileUtils:
    def test_allowed_file_with_valid_extension(self):
        assert allowed_file("image.jpg", {"jpg", "png"}) is True
        assert allowed_file("image.jpeg", {"jpg", "png", "jpeg"}) is True
        assert allowed_file("image.webp", {"jpg", "png", "webp"}) is True
        assert allowed_file("photo.JPEG", {"jpg", "jpeg", "png"}) is True

    def test_allowed_file_with_invalid_extension(self):
        assert allowed_file("file.pdf", {"jpg", "png"}) is False
        assert allowed_file("file.txt", {"jpg", "png"}) is False

    def test_allowed_file_with_no_extension(self):
        assert allowed_file("noextension", {"jpg", "png"}) is False
        assert allowed_file("", {"jpg", "png"}) is False
        assert allowed_file(None, {"jpg", "png"}) is False

    def test_build_safe_filename(self):
        name1 = build_safe_filename("original.jpg")
        name2 = build_safe_filename("photo.png")
        assert name1.endswith(".jpg")
        assert name2.endswith(".png")
        assert name1 != name2
        assert len(name1.split(".")[0]) == 32

    def test_ensure_directory_creates_path(self, tmp_path):
        target = tmp_path / "subdir" / "nested"
        ensure_directory(str(target))
        assert target.exists()
        assert target.is_dir()


class TestResponseUtils:
    def test_success_response_default(self, app):
        with app.app_context():
            response, status = success_response()
            data = response.get_json()
            assert status == 200
            assert data["success"] is True
            assert data["message"] == "Success"
            assert data["data"] == {}

    def test_success_response_with_data_and_message(self, app):
        with app.app_context():
            response, status = success_response(
                data={"id": 1, "name": "test"},
                message="Created",
                status_code=201,
            )
            data = response.get_json()
            assert status == 201
            assert data["success"] is True
            assert data["message"] == "Created"
            assert data["data"] == {"id": 1, "name": "test"}

    def test_error_response_default(self, app):
        with app.app_context():
            response, status = error_response()
            data = response.get_json()
            assert status == 400
            assert data["success"] is False
            assert data["error"] == "Error"
            assert data["details"] == ""

    def test_error_response_with_details(self, app):
        with app.app_context():
            response, status = error_response(
                message="Validation failed",
                details="Field x is required",
                status_code=422,
            )
            data = response.get_json()
            assert status == 422
            assert data["success"] is False
            assert data["error"] == "Validation failed"
            assert data["details"] == "Field x is required"
