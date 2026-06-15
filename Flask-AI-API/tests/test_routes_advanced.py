import pytest
import json
from pathlib import Path
from unittest.mock import MagicMock, patch


class TestTabRoutesAdvanced:
    """Extended tab route tests for higher coverage."""

    def test_detect_with_valid_image(self, client, tmp_path, monkeypatch):
        """POST /api/tab/detect with a real temporary image."""
        import cv2
        import numpy as np

        img = np.zeros((200, 400, 3), dtype=np.uint8)
        img_path = tmp_path / "test_tab.jpg"
        cv2.imwrite(str(img_path), img)

        with open(img_path, 'rb') as f:
            response = client.post(
                '/api/tab/detect',
                data={'image': (f, 'mytab.jpg')},
                content_type='multipart/form-data',
            )

        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert 'result' in data['data']

    def test_detect_with_unsupported_format(self, client, tmp_path):
        """POST with unsupported file type returns 415."""
        txt_path = tmp_path / "test.txt"
        txt_path.write_text("not an image")
        with open(txt_path, 'rb') as f:
            response = client.post(
                '/api/tab/detect',
                data={'image': (f, 'test.txt')},
                content_type='multipart/form-data',
            )
        assert response.status_code == 415
        data = response.get_json()
        assert data['success'] is False

    def test_render_with_staffs_and_notes(self, client):
        """POST /api/tab/render with full structured payload."""
        payload = {
            "staffs": [
                {
                    "staff_id": 0,
                    "events": [
                        {"string_fret_map": {"e": 0, "B": 1, "G": 2, "D": 3, "A": 2, "E": 0}}
                    ]
                }
            ],
            "notes": [],
            "events": [],
            "metadata": {},
        }
        response = client.post("/api/tab/render", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert 'ascii_tab' in data['data']
        assert 'grid' in data['data']

    def test_render_with_empty_staffs(self, client):
        """POST /api/tab/render with empty staffs returns empty."""
        payload = {"staffs": [], "notes": [], "events": [], "metadata": {}}
        response = client.post("/api/tab/render", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True

    def test_get_tab_after_save(self, client):
        """GET /api/tab/<id> after saving returns correct data."""
        payload = {"staffs": [], "notes": [], "events": [], "metadata": {"title": "Test Tab"}}
        save_resp = client.post("/api/tab/save", json=payload)
        assert save_resp.status_code == 201
        tab_id = save_resp.get_json()['data']['tab_id']

        get_resp = client.get(f"/api/tab/{tab_id}")
        assert get_resp.status_code == 200
        data = get_resp.get_json()
        assert data['success'] is True
        assert data['data']['metadata']['title'] == "Test Tab"
