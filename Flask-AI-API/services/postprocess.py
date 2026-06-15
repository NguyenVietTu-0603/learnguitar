"""
PostProcessor — hậu xử lý kết quả nhận diện.

Thực hiện:
  1. Gán lại string cho mỗi note dựa trên vị trí line của staff
  2. Parse fret từ predicted_class_name (ví dụ "B_3" -> fret=3)
  3. Loại bỏ detection trùng lặp (cùng staff, cùng string, cùng fret, gần nhau)
  4. Nhóm các note gần nhau theo x thành event
  5. Đánh flag uncertain nếu string_distance lớn
"""

from collections import defaultdict
from copy import deepcopy

import numpy as np


STRING_ORDER = ["e", "B", "G", "D", "A", "E"]
STRING_TO_INDEX = {s: i for i, s in enumerate(STRING_ORDER)}

DEDUP_X_THRESHOLD_RATIO = 0.35
DEDUP_Y_THRESHOLD_RATIO = 0.30
COLUMN_X_THRESHOLD_RATIO = 0.60
STRING_UNCERTAIN_THRESHOLD_RATIO = 0.30


class PostProcessor:
    def __init__(self, line_processor):
        self.line_processor = line_processor

    def process(self, detections: list[dict], staffs: list[dict]) -> list[dict]:
        """
        Xử lý toàn bộ detections và trả về danh sách note đã chuẩn hóa.

        Args:
            detections: list từ DetectorService
            staffs: list từ LineProcessor

        Returns:
            List of processed notes với các trường:
              staff_id, bbox, center, confidence,
              predicted_class_name, predicted_string, predicted_fret,
              corrected_string, corrected_string_index,
              fret, corrected_class_name,
              string_distance, string_uncertain
        """
        staff_map = {s["staff_id"]: s for s in staffs}
        enriched = []

        for det in detections:
            cx = det["center_x"]
            cy = det["center_y"]
            staff = self._find_nearest_staff(cy, staffs)
            if staff is None:
                continue

            string_id, string_dist = self.line_processor.assign_string_to_staff(cy, staff)
            spacing = staff["spacing"]
            uncertain = string_dist > (STRING_UNCERTAIN_THRESHOLD_RATIO * spacing)

            predicted_class = det["predicted_class_name"]
            predicted_string, predicted_fret = self._parse_class(predicted_class)
            corrected_string = STRING_ORDER[string_id]
            corrected_class = f"{corrected_string}_{predicted_fret}"

            x1, y1, x2, y2 = det["bbox"]

            enriched.append({
                "staff_id": staff["staff_id"],
                "bbox": det["bbox"],
                "center": [cx, cy],
                "x": cx,
                "y": cy,
                "width": x2 - x1,
                "height": y2 - y1,
                "confidence": det["confidence"],
                "predicted_class_name": predicted_class,
                "predicted_string": predicted_string,
                "predicted_fret": predicted_fret,
                "corrected_string": corrected_string,
                "corrected_string_index": string_id,
                "fret": predicted_fret,
                "corrected_class_name": corrected_class,
                "string_distance": string_dist,
                "string_uncertain": uncertain,
                "staff_spacing": spacing,
            })

        deduped = self._deduplicate(enriched, staff_map)
        return deduped

    def _find_nearest_staff(self, y: float, staffs: list[dict]) -> dict | None:
        if not staffs:
            return None
        distances = [
            abs(y - (s["top_y"] + s["bottom_y"]) / 2)
            for s in staffs
        ]
        return staffs[np.argmin(distances)]

    def _parse_class(self, class_name: str) -> tuple[str, int]:
        """
        Parse class name thành (string, fret).
        Ví dụ: "B_3" -> ("B", 3), "e_0" -> ("e", 0)
        """
        if class_name is None:
            return STRING_ORDER[0], 0
        parts = str(class_name).rsplit("_", 1)
        if len(parts) == 2:
            s = parts[0]
            try:
                f = int(parts[1])
            except ValueError:
                f = 0
        else:
            s = STRING_ORDER[0]
            try:
                f = int(parts[0])
            except ValueError:
                f = 0
        if s not in STRING_TO_INDEX:
            s = STRING_ORDER[0]
        return s, f

    def _deduplicate(self, notes: list[dict], staff_map: dict) -> list[dict]:
        """
        Loại bỏ note trùng:
        - Cùng staff
        - Cùng string + fret
        - Gần nhau theo x/y (tính theo staff spacing)
        Giữ note có confidence cao nhất và string_uncertain thấp nhất.
        """
        by_staff = defaultdict(list)
        for n in notes:
            by_staff[n["staff_id"]].append(n)

        deduped = []

        for staff_id, staff_notes in by_staff.items():
            spacing = float(staff_map.get(staff_id, {}).get("spacing", 20.0))
            x_thr = DEDUP_X_THRESHOLD_RATIO * spacing
            y_thr = DEDUP_Y_THRESHOLD_RATIO * spacing

            bucket = defaultdict(list)
            for n in staff_notes:
                key = (n["corrected_string"], str(n["fret"]))
                bucket[key].append(n)

            for group in bucket.values():
                group = sorted(group, key=lambda n: (n["x"], -n["confidence"]))
                merged_groups = []
                current = [group[0]]

                for n in group[1:]:
                    prev = current[-1]
                    if abs(n["x"] - prev["x"]) <= x_thr and abs(n["y"] - prev["y"]) <= y_thr:
                        current.append(n)
                    else:
                        merged_groups.append(current)
                        current = [n]
                merged_groups.append(current)

                for mg in merged_groups:
                    rep = sorted(
                        mg,
                        key=lambda n: (
                            n["string_uncertain"],
                            -n["confidence"],
                            abs(n["string_distance"]),
                        )
                    )[0]
                    rep = deepcopy(rep)
                    rep["merged_duplicate_count"] = len(mg)
                    rep["merged_note_ids"] = [x.get("note_id", f"n{i}") for i, x in enumerate(mg)]
                    deduped.append(rep)

        deduped = sorted(deduped, key=lambda n: (n["staff_id"], n["x"], n["y"]))
        return deduped

    def group_into_events(self, notes: list[dict], staffs: list[dict]) -> list[dict]:
        """
        Nhóm các note thành events dựa trên vị trí x.

        Args:
            notes: danh sách note đã post-process
            staffs: danh sách staff

        Returns:
            List of events:
            {
                "event_id": str,
                "staff_id": int,
                "event_index_in_staff": int,
                "x_center": float,
                "note_count": int,
                "notes": [...],
                "string_fret_map": {s: fret or None},
                "string_note_id_map": {s: note_id or None},
            }
        """
        if not notes:
            return []

        staff_map = {s["staff_id"]: s for s in staffs}
        by_staff = defaultdict(list)
        for n in notes:
            by_staff[n["staff_id"]].append(n)

        all_events = []

        for staff_id in sorted(by_staff.keys()):
            staff_notes = sorted(by_staff[staff_id], key=lambda n: (n["x"], n["y"]))
            staff_info = staff_map.get(staff_id, {})
            spacing = float(staff_info.get("spacing", 20.0))
            column_thr = COLUMN_X_THRESHOLD_RATIO * spacing

            clusters = []
            current = [staff_notes[0]]
            for n in staff_notes[1:]:
                cluster_x = sum(x["x"] for x in current) / len(current)
                if abs(n["x"] - cluster_x) <= column_thr:
                    current.append(n)
                else:
                    clusters.append(current)
                    current = [n]
            clusters.append(current)

            for event_idx, cluster in enumerate(clusters):
                cluster = sorted(cluster, key=lambda n: n["corrected_string_index"])
                event_x = sum(n["x"] for n in cluster) / len(cluster)

                string_fret_map = {s: None for s in STRING_ORDER}
                string_note_id_map = {s: None for s in STRING_ORDER}
                note_entries = []

                for n in cluster:
                    s = n["corrected_string"]
                    fret_text = str(n["fret"])
                    string_fret_map[s] = fret_text
                    string_note_id_map[s] = n.get("note_id", f"n{len(all_events)}")

                    note_entries.append({
                        "note_id": n.get("note_id", ""),
                        "string": s,
                        "string_index": n["corrected_string_index"],
                        "fret": fret_text,
                        "x": n["x"],
                        "y": n["y"],
                        "confidence": n["confidence"],
                        "string_uncertain": n["string_uncertain"],
                        "source_bbox": n["bbox"],
                        "source_class_name": n["predicted_class_name"],
                        "corrected_class_name": n["corrected_class_name"],
                        "merged_duplicate_count": n.get("merged_duplicate_count", 1),
                    })

                all_events.append({
                    "event_id": f"s{staff_id:03d}_e{event_idx:04d}",
                    "staff_id": staff_id,
                    "event_index_in_staff": event_idx,
                    "x_center": float(event_x),
                    "note_count": len(cluster),
                    "notes": note_entries,
                    "string_fret_map": string_fret_map,
                    "string_note_id_map": string_note_id_map,
                    "layout_hints": {
                        "min_x": float(min(n["x"] for n in cluster)),
                        "max_x": float(max(n["x"] for n in cluster)),
                        "x_span": float(
                            max(n["x"] for n in cluster) - min(n["x"] for n in cluster)
                        ),
                    },
                })

        return all_events
