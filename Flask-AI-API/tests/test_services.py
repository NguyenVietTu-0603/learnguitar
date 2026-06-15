import pytest
from services import DetectorService


class TestDetectorService:
    def test_init_without_model_path(self):
        service = DetectorService()
        assert service.model is None
        assert service.model_path is None

    def test_init_with_model_path(self):
        service = DetectorService("/path/to/model.pt")
        assert service.model is None
        assert service.model_path == "/path/to/model.pt"

    def test_load_model_with_missing_file_does_not_raise(self):
        service = DetectorService("/nonexistent/path/best.pt")
        service.load_model()
        assert service.model is None

    def test_detect_raises_when_model_not_loaded(self):
        service = DetectorService()
        import numpy as np
        dummy_image = __import__("numpy").zeros((100, 100, 3), dtype=np.uint8)
        with pytest.raises(RuntimeError, match="Model not loaded"):
            service.detect(dummy_image)

    def test_parse_results_structure(self):
        service = DetectorService()
        service.model = None
        mock_results = []
        detections = service._parse_results(mock_results)
        assert detections == []

    def test_load_model_with_existing_file_skipped(self, tmp_path):
        """load_model is idempotent - calling twice doesn't re-load."""
        service = DetectorService()
        service.model = "already_loaded"
        service.load_model()
        assert service.model == "already_loaded"
