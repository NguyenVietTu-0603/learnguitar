import pytest
import json
from unittest.mock import MagicMock, patch, call
from pathlib import Path


class TestLineProcessor:
    """Tests for LineProcessor service."""

    def test_init(self):
        from services import LineProcessor
        lp = LineProcessor()
        assert lp is not None

    def test_detect_staffs_empty(self):
        from services import LineProcessor
        import numpy as np

        lp = LineProcessor()
        empty_img = np.zeros((10, 10, 3), dtype=np.uint8)
        result = lp.detect_staffs(empty_img)
        assert isinstance(result, list)


class TestJSONBuilder:
    """Tests for JSONBuilder service."""

    def test_build_with_metadata(self):
        from services import JSONBuilder

        builder = JSONBuilder()
        staffs = [{"staff_id": 0, "top_y": 10, "bottom_y": 100}]
        notes = [
            {"staff_id": 0, "bbox": [0, 0, 10, 10], "confidence": 0.9, "string_uncertain": False},
            {"staff_id": 0, "bbox": [0, 0, 10, 10], "confidence": 0.9, "string_uncertain": True, "merged_duplicate_count": 2},
        ]
        events = []

        result = builder.build(
            staffs_data=staffs,
            deduped_notes=notes,
            events=events,
            metadata_extra={"filename": "test.jpg"},
        )

        assert "metadata" in result
        assert "staffs" in result
        assert "notes" in result
        assert "events" in result
        assert result["metadata"]["schema_version"] == "1.0"
        assert result["metadata"]["uncertain_note_count"] == 1

    def test_build_without_metadata(self):
        from services import JSONBuilder

        builder = JSONBuilder()
        result = builder.build(staffs_data=[], deduped_notes=[], events=[])

        assert "metadata" in result
        assert "staffs" in result
        assert "notes" in result
        assert "events" in result

    def test_build_with_multiple_staffs(self):
        from services import JSONBuilder

        builder = JSONBuilder()
        staffs = [
            {"staff_id": 0, "top_y": 10, "bottom_y": 100},
            {"staff_id": 1, "top_y": 120, "bottom_y": 210},
        ]
        notes = [
            {"staff_id": 0, "bbox": [0, 0, 10, 10], "confidence": 0.9},
            {"staff_id": 1, "bbox": [0, 120, 10, 130], "confidence": 0.8},
        ]
        events = [
            {"staff_id": 0, "event_index_in_staff": 0, "string_fret_map": {"e": 0}},
            {"staff_id": 1, "event_index_in_staff": 0, "string_fret_map": {"B": 1}},
        ]

        result = builder.build(staffs_data=staffs, deduped_notes=notes, events=events)
        assert result["metadata"]["staff_count"] == 2
        assert len(result["staffs"]) == 2


class TestTabRenderer:
    """Tests for TabRenderer service."""

    def test_init(self):
        from services import TabRenderer
        renderer = TabRenderer()
        assert renderer is not None

    def test_render_from_empty_staffs(self):
        from services import TabRenderer

        renderer = TabRenderer()
        result = renderer.render_from_json({"staffs": []})
        assert result == ""

    def test_render_from_empty_events(self):
        from services import TabRenderer

        renderer = TabRenderer()
        payload = {
            "staffs": [
                {"staff_id": 0, "events": [], "top_y": 0, "bottom_y": 100},
            ],
            "notes": [],
            "events": [],
        }
        result = renderer.render_from_json(payload)
        assert isinstance(result, str)
        assert "e|" in result

    def test_render_with_events(self):
        from services import TabRenderer

        renderer = TabRenderer()
        payload = {
            "staffs": [
                {
                    "staff_id": 0,
                    "events": [
                        {"string_fret_map": {"e": 0, "B": 1, "G": 2, "D": 3, "A": 2, "E": 0}},
                        {"string_fret_map": {"e": None, "B": None, "G": None, "D": None, "A": None, "E": None}},
                    ],
                }
            ],
            "notes": [],
            "events": [],
        }
        result = renderer.render_from_json(payload)
        assert isinstance(result, str)
        assert "e|" in result
        assert "B|" in result

    def test_render_grid(self):
        from services import TabRenderer

        renderer = TabRenderer()
        payload = {
            "staffs": [
                {"staff_id": 0, "events": [{"string_fret_map": {"e": 0}}], "top_y": 0, "bottom_y": 100},
            ],
            "notes": [],
            "events": [],
        }
        grid = renderer.render_grid(payload)
        assert isinstance(grid, list)

    def test_render_with_custom_string_order(self):
        from services import TabRenderer

        renderer = TabRenderer()
        payload = {
            "staffs": [
                {"staff_id": 0, "events": [{"string_fret_map": {"e": 0, "B": 1}}], "top_y": 0, "bottom_y": 100},
            ],
            "notes": [],
            "events": [],
        }
        result = renderer.render_from_json(payload, string_order=["e", "B"])
        assert isinstance(result, str)


class TestPostProcessor:
    """Tests for PostProcessor service."""

    def test_init(self):
        from services import PostProcessor, LineProcessor
        lp = LineProcessor()
        pp = PostProcessor(lp)
        assert pp is not None

    def test_process_with_empty_detections(self):
        from services import PostProcessor, LineProcessor
        import numpy as np

        lp = LineProcessor()
        pp = PostProcessor(lp)
        staffs = [
            {"staff_id": 0, "top_y": 0, "bottom_y": 200, "line_ys": [0, 40, 80, 120, 160, 200], "spacing": 40}
        ]
        result = pp.process([], staffs)
        assert result == []

    def test_group_into_events_empty(self):
        from services import PostProcessor, LineProcessor

        lp = LineProcessor()
        pp = PostProcessor(lp)
        notes = []
        staffs = []
        result = pp.group_into_events(notes, staffs)
        assert result == []

    def test_process_single_detection(self):
        from services import PostProcessor, LineProcessor

        lp = LineProcessor()
        pp = PostProcessor(lp)
        staffs = [
            {"staff_id": 0, "top_y": 0, "bottom_y": 200, "line_ys": [0, 40, 80, 120, 160, 200], "spacing": 40}
        ]
        detections = [
            {
                "bbox": [50, 30, 80, 50],
                "confidence": 0.95,
                "predicted_class_name": "B_2",
                "center_x": 65,
                "center_y": 40,
            }
        ]
        result = pp.process(detections, staffs)
        assert len(result) >= 1
