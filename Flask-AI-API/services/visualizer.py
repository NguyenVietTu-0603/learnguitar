from pathlib import Path

import cv2
import numpy as np

STRING_ORDER = ["e", "B", "G", "D", "A", "E"]
STAFF_PALETTE = [
    (82, 196, 26),
    (255, 196, 61),
    (255, 99, 132),
    (54, 162, 235),
    (153, 102, 255),
    (255, 159, 64),
]


def _clamp_point(x: float, y: float, width: int, height: int) -> tuple[int, int]:
    return max(0, min(int(round(x)), width - 1)), max(0, min(int(round(y)), height - 1))


class DetectionVisualizer:
    def annotate(
        self,
        image: np.ndarray,
        detections: list[dict],
        staffs: list[dict],
        processed_notes: list[dict],
        output_path: str | Path,
    ) -> str:
        canvas = image.copy()
        height, width = canvas.shape[:2]

        self._draw_staffs(canvas, staffs, width)
        self._draw_raw_detections(canvas, detections, width, height)
        self._draw_processed_notes(canvas, processed_notes, width, height)

        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(output_path), canvas)
        return str(output_path)

    def _draw_staffs(self, canvas: np.ndarray, staffs: list[dict], width: int) -> None:
        for staff in staffs:
            color = STAFF_PALETTE[staff["staff_id"] % len(STAFF_PALETTE)]
            staff_label = f"Staff {staff['staff_id']}"
            top_y = int(round(staff.get("top_y", 0)))
            bottom_y = int(round(staff.get("bottom_y", 0)))
            mid_y = int(round((top_y + bottom_y) / 2))

            cv2.rectangle(
                canvas,
                (0, max(0, top_y - 6)),
                (max(0, width - 1), min(canvas.shape[0] - 1, bottom_y + 6)),
                color,
                1,
            )
            cv2.putText(
                canvas,
                staff_label,
                (12, max(18, top_y - 10)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                color,
                2,
                cv2.LINE_AA,
            )

            for idx, y in enumerate(staff.get("lines", [])):
                line_y = int(round(y))
                cv2.line(canvas, (0, line_y), (max(0, width - 1), line_y), color, 1, cv2.LINE_AA)
                if idx < len(STRING_ORDER):
                    cv2.putText(
                        canvas,
                        STRING_ORDER[idx],
                        (max(10, width - 24), max(18, line_y - 4)),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.45,
                        color,
                        1,
                        cv2.LINE_AA,
                    )

            cv2.circle(canvas, (20, mid_y), 5, color, -1, cv2.LINE_AA)

    def _draw_raw_detections(self, canvas: np.ndarray, detections: list[dict], width: int, height: int) -> None:
        for det in detections:
            bbox = det.get("bbox") or []
            if len(bbox) != 4:
                continue

            x1, y1, x2, y2 = bbox
            pt1 = _clamp_point(x1, y1, width, height)
            pt2 = _clamp_point(x2, y2, width, height)
            label = f"{det.get('predicted_class_name', '?')} {det.get('confidence', 0.0):.2f}"

            cv2.rectangle(canvas, pt1, pt2, (30, 144, 255), 1, cv2.LINE_AA)
            cv2.putText(
                canvas,
                label,
                (pt1[0], max(18, pt1[1] - 6)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.42,
                (30, 144, 255),
                1,
                cv2.LINE_AA,
            )

    def _draw_processed_notes(self, canvas: np.ndarray, processed_notes: list[dict], width: int, height: int) -> None:
        for note in processed_notes:
            bbox = note.get("bbox") or []
            if len(bbox) != 4:
                continue

            x1, y1, x2, y2 = bbox
            staff_id = int(note.get("staff_id", 0))
            color = STAFF_PALETTE[staff_id % len(STAFF_PALETTE)]
            pt1 = _clamp_point(x1, y1, width, height)
            pt2 = _clamp_point(x2, y2, width, height)
            center = _clamp_point(note.get("x", (x1 + x2) / 2), note.get("y", (y1 + y2) / 2), width, height)
            text = f"{note.get('corrected_string', '?')}{note.get('fret', '?')}"
            if note.get("string_uncertain"):
                text += " ?"

            cv2.rectangle(canvas, pt1, pt2, color, 2, cv2.LINE_AA)
            cv2.circle(canvas, center, 4, color, -1, cv2.LINE_AA)
            cv2.putText(
                canvas,
                text,
                (pt1[0], min(height - 10, pt2[1] + 18)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.52,
                color,
                2,
                cv2.LINE_AA,
            )
