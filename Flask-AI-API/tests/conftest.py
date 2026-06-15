import os
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

os.environ["FLASK_DEBUG"] = "false"
os.environ["APP_NAME"] = "Flask AI API Test"


@pytest.fixture
def mock_services():
    """Provides mocked services to avoid loading the heavy YOLO model during tests."""
    mock_detector = MagicMock()
    mock_detector.detect.return_value = [
        {
            "bbox": [100, 100, 150, 140],
            "confidence": 0.95,
            "predicted_class_name": "B_3",
            "center_x": 125.0,
            "center_y": 120.0,
        },
        {
            "bbox": [200, 100, 250, 140],
            "confidence": 0.90,
            "predicted_class_name": "E_2",
            "center_x": 225.0,
            "center_y": 120.0,
        },
    ]

    mock_line_processor = MagicMock()
    mock_line_processor.detect_staffs.return_value = [
        {
            "staff_id": 0,
            "top_y": 100,
            "bottom_y": 200,
            "left_x": 0,
            "right_x": 400,
            "num_lines": 6,
            "line_spacing": 20,
            "avg_staff_height": 100,
        }
    ]

    mock_post_processor = MagicMock()
    mock_post_processor.process.return_value = [
        {"bbox": [100, 100, 150, 140], "predicted_class_name": "B_3", "confidence": 0.95, "center_x": 125.0, "center_y": 120.0, "staff_id": 0},
        {"bbox": [200, 100, 250, 140], "predicted_class_name": "E_2", "confidence": 0.90, "center_x": 225.0, "center_y": 120.0, "staff_id": 0},
    ]
    mock_post_processor.group_into_events.return_value = []

    mock_json_builder = MagicMock()
    mock_json_builder.build.return_value = {
        "staffs": [],
        "notes": [],
        "events": [],
        "metadata": {"filename": "test.jpg", "raw_note_count": 2},
    }

    mock_renderer = MagicMock()
    mock_renderer.render_from_json.return_value = "e|---B---|\nB|---2---|\n"
    mock_renderer.render_grid.return_value = []

    mock_visualizer = MagicMock()

    return {
        "detector": mock_detector,
        "line_processor": mock_line_processor,
        "post_processor": mock_post_processor,
        "json_builder": mock_json_builder,
        "renderer": mock_renderer,
        "visualizer": mock_visualizer,
    }


@pytest.fixture
def app(mock_services):
    """Creates a test Flask app with mocked services."""
    from app import create_app

    test_app = create_app()
    test_app.extensions["services"] = mock_services
    test_app.config["TESTING"] = True
    return test_app


@pytest.fixture
def client(app):
    """Provides a test client."""
    return app.test_client()


@pytest.fixture
def sample_image_path(tmp_path):
    """Creates a minimal valid image file for upload tests."""
    import cv2
    import numpy as np

    img = np.zeros((200, 400, 3), dtype=np.uint8)
    img_path = tmp_path / "test_image.jpg"
    cv2.imwrite(str(img_path), img)
    return str(img_path)
