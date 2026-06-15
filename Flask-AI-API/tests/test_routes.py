import pytest


class TestHealthRoutes:
    def test_health_check_returns_ok(self, client):
        """GET /health should return status ok."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "ok"
        assert data["service"] == "tablature-api"

    def test_root_returns_service_info(self, client):
        """GET / should return service metadata."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.get_json()
        assert data["service"] == "Flask AI API Test"
        assert data["status"] == "running"
        assert "/health" in data["endpoints"]
        assert "/api/tab/detect" in data["endpoints"]


class TestTabRoutes:
    def test_detect_missing_image_returns_400(self, client):
        """POST /api/tab/detect without image should return 400."""
        response = client.post("/api/tab/detect")
        assert response.status_code == 400
        data = response.get_json()
        assert data["success"] is False
        assert "Missing image file" in data["error"]

    def test_detect_empty_filename_returns_400(self, client):
        """POST /api/tab/detect with empty filename should return 400."""
        response = client.post(
            "/api/tab/detect",
            data={"image": (b"", "")},
            content_type="multipart/form-data",
        )
        assert response.status_code == 400
        data = response.get_json()
        assert data["success"] is False

    def test_render_missing_body_returns_400(self, client):
        """POST /api/tab/render without body should return 400."""
        response = client.post("/api/tab/render")
        assert response.status_code == 400
        data = response.get_json()
        assert data["success"] is False

    def test_render_with_valid_body_returns_200(self, client):
        """POST /api/tab/render with valid body should return rendered tab."""
        payload = {"staffs": [], "notes": [], "events": []}
        response = client.post("/api/tab/render", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True
        assert "ascii_tab" in data["data"]

    def test_save_with_valid_body_returns_201(self, client):
        """POST /api/tab/save should save tab and return tab_id."""
        payload = {"staffs": [], "notes": [], "events": []}
        response = client.post("/api/tab/save", json=payload)
        assert response.status_code == 201
        data = response.get_json()
        assert data["success"] is True
        assert "tab_id" in data["data"]
        assert "saved_path" in data["data"]

    def test_get_tab_not_found_returns_404(self, client):
        """GET /api/tab/<tab_id> for non-existent tab should return 404."""
        response = client.get("/api/tab/nonexistent123")
        assert response.status_code == 404
        data = response.get_json()
        assert data["success"] is False
        assert "Tab not found" in data["error"]
