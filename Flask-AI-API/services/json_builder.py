"""
JSONBuilder — xây dựng JSON đầu ra chuẩn cho dự án nhận diện tablature.

Schema JSON đầu ra gồm 4 phần:
  1. metadata: thông tin phiên bản, số staff, số note, ...
  2. notes: danh sách note chi tiết (note-level, deduped)
  3. staffs: cấu trúc theo staff + events (dùng cho render web)
  4. events: danh sách flat tất cả events

Schema được thiết kế theo format mà pipeline nhận diện của bạn đã xuất ra,
để đảm bảo tương thích với code render/restore đã có.
"""

from datetime import datetime, timezone


SCHEMA_VERSION = "1.0"
STRING_ORDER = ["e", "B", "G", "D", "A", "E"]


class JSONBuilder:
    def build(
        self,
        staffs_data: list[dict],
        deduped_notes: list[dict],
        events: list[dict],
        metadata_extra: dict | None = None,
    ) -> dict:
        """
        Xây dựng JSON đầu ra hoàn chỉnh.

        Args:
            staffs_data: danh sách staff từ LineProcessor
            deduped_notes: danh sách note đã deduplicate từ PostProcessor
            events: danh sách events từ PostProcessor.group_into_events
            metadata_extra: thông tin bổ sung (filename, image_w/h, ...)

        Returns:
            dict JSON chuẩn
        """
        metadata_extra = metadata_extra or {}

        uncertain_count = sum(1 for n in deduped_notes if n.get("string_uncertain", False))
        merged_count = sum(
            max(0, n.get("merged_duplicate_count", 1) - 1)
            for n in deduped_notes
        )

        # staff export: gom events theo staff_id
        staff_map = {s["staff_id"]: s for s in staffs_data}
        events_by_staff = {sid: [] for sid in staff_map}
        for evt in events:
            events_by_staff[evt["staff_id"]].append(evt)

        staffs_export = []
        for staff_id in sorted(staff_map.keys()):
            staff_info = staff_map[staff_id]
            staff_events = sorted(
                events_by_staff.get(staff_id, []),
                key=lambda e: e["event_index_in_staff"],
            )
            staffs_export.append({
                "staff_id": staff_id,
                "line_ys": staff_info.get("line_ys", []),
                "spacing": float(staff_info.get("spacing", 20.0)),
                "source": staff_info.get("source", ""),
                "note_count_after_dedup": sum(
                    1 for n in deduped_notes if n["staff_id"] == staff_id
                ),
                "event_count": len(staff_events),
                "events": staff_events,
            })

        output = {
            "schema_version": SCHEMA_VERSION,
            "type": "tablature_detection_result",
            "generated_at": datetime.now(timezone.utc).isoformat(),

            "metadata": {
                "schema_version": SCHEMA_VERSION,
                "string_order_top_to_bottom": STRING_ORDER,
                "staff_count": len(staffs_export),
                "raw_note_count": metadata_extra.get("raw_note_count", len(deduped_notes)),
                "note_count_after_dedup": len(deduped_notes),
                "event_count_total": len(events),
                "uncertain_note_count": uncertain_count,
                "merged_duplicate_count": merged_count,
                "filename": metadata_extra.get("filename", ""),
                "image_width": metadata_extra.get("image_width", 0),
                "image_height": metadata_extra.get("image_height", 0),
            },

            "notes": self._build_notes(deduped_notes),

            "staffs": staffs_export,

            "events": events,
        }

        return output

    def _build_notes(self, deduped_notes: list[dict]) -> list[dict]:
        """Xây dựng phần notes (note-level, deduped)."""
        result = []
        for idx, note in enumerate(deduped_notes):
            bbox = note.get("bbox", [])
            center = note.get("center", [0.0, 0.0])
            result.append({
                "note_id": f"s{note['staff_id']:03d}_n{idx:04d}",
                "staff_id": note["staff_id"],
                "bbox": [float(x) for x in bbox],
                "center": [float(c) for c in center],
                "x": float(note.get("x", 0.0)),
                "y": float(note.get("y", 0.0)),
                "width": float(note.get("width", 0.0)),
                "height": float(note.get("height", 0.0)),
                "confidence": float(note.get("confidence", 0.0)),
                "predicted_class_name": note.get("predicted_class_name", ""),
                "predicted_string": note.get("predicted_string", ""),
                "predicted_fret": note.get("predicted_fret", 0),
                "corrected_string": note.get("corrected_string", ""),
                "corrected_string_index": note.get("corrected_string_index", 0),
                "fret": note.get("fret", 0),
                "corrected_class_name": note.get("corrected_class_name", ""),
                "string_distance": float(note.get("string_distance", 0.0)),
                "string_uncertain": bool(note.get("string_uncertain", False)),
                "staff_spacing": float(note.get("staff_spacing", 20.0)),
                "merged_duplicate_count": note.get("merged_duplicate_count", 1),
            })
        return result

    def build_error(self, message: str, details: str = "") -> dict:
        """Tạo JSON response lỗi chuẩn."""
        return {
            "success": False,
            "error": message,
            "details": details,
            "schema_version": SCHEMA_VERSION,
        }

    def build_success(self, data: dict, message: str = "") -> dict:
        """Tạo JSON response thành công chuẩn."""
        return {
            "success": True,
            "message": message,
            "schema_version": SCHEMA_VERSION,
            "data": data,
        }
