"""
LineProcessor — phát hiện các đường line ngang của tablature.

Dùng OpenCV để:
  1. Chuyển ảnh sang grayscale
  2. Nhị phân hóa / edge enhance theo nhiều chiến lược
  3. Tìm các line ngang bằng projection + morphology
  4. Gộp các line gần nhau thành staff (ưu tiên 6 dòng mỗi staff)

Kết quả dùng để hiệu chỉnh string cho mỗi detection
và tính spacing giữa các dòng.
"""

import cv2
import numpy as np


class LineProcessor:
    def __init__(self):
        pass

    def detect_staffs(self, image: np.ndarray) -> list[dict]:
        """
        Phát hiện vị trí các staff trong ảnh.

        Args:
            image: ảnh BGR (OpenCV format)

        Returns:
            List of staff dicts:
            {
                "staff_id": int,
                "line_ys": [y1, y2, y3, y4, y5, y6],
                "spacing": float,
                "source": str,
                "top_y": int,
                "bottom_y": int,
            }
        """
        raw_staffs = self.find_line_positions(image)

        if raw_staffs:
            return [
                self._build_staff_summary(staff_id, line_ys)
                for staff_id, line_ys in enumerate(raw_staffs)
            ]

        return []

    def find_line_positions(self, image: np.ndarray) -> list[list[int]]:
        """
        Phát hiện tất cả các đường ngang bằng OpenCV.

        Trả về danh sách staff, mỗi staff là danh sách 6 vị trí y.
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        gray = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX)

        candidates: list[int] = []
        for processed in self._build_line_masks(gray):
            candidates.extend(self._extract_horizontal_lines(processed))

        merged_lines = self._merge_line_positions(candidates)
        return self._group_into_staffs(merged_lines)

    def _build_line_masks(self, gray: np.ndarray) -> list[np.ndarray]:
        width = max(gray.shape[1], 1)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)

        otsu_inv = cv2.threshold(
            blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
        )[1]
        adaptive_inv = cv2.adaptiveThreshold(
            blur,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            31,
            11,
        )

        open_kernel = cv2.getStructuringElement(
            cv2.MORPH_RECT, (max(width // 120, 3), 1)
        )
        horizontal_kernel = cv2.getStructuringElement(
            cv2.MORPH_RECT, (max(width // 8, 12), 1)
        )

        masks = []
        for binary in (otsu_inv, adaptive_inv):
            cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, open_kernel, iterations=1)
            horizontal = cv2.morphologyEx(
                cleaned, cv2.MORPH_OPEN, horizontal_kernel, iterations=1
            )
            strengthened = cv2.dilate(horizontal, horizontal_kernel, iterations=1)
            masks.extend([horizontal, strengthened])

        return masks

    def _extract_horizontal_lines(self, mask: np.ndarray) -> list[int]:
        if mask.size == 0:
            return []

        row_strength = np.count_nonzero(mask > 0, axis=1)
        if row_strength.size == 0 or row_strength.max() == 0:
            return []

        min_run_width = max(int(mask.shape[1] * 0.18), 20)
        threshold = max(int(row_strength.max() * 0.35), min_run_width)

        line_positions = []
        start = None
        for idx, value in enumerate(row_strength):
            if value >= threshold:
                if start is None:
                    start = idx
            elif start is not None:
                end = idx - 1
                if end - start + 1 <= max(10, mask.shape[0] // 20):
                    line_positions.append(int((start + end) / 2))
                start = None

        if start is not None:
            end = len(row_strength) - 1
            if end - start + 1 <= max(10, mask.shape[0] // 20):
                line_positions.append(int((start + end) / 2))

        return line_positions

    def _merge_line_positions(self, line_positions: list[int], tolerance: int = 6) -> list[int]:
        if not line_positions:
            return []

        positions = sorted(line_positions)
        merged = [[positions[0]]]

        for y in positions[1:]:
            if y - merged[-1][-1] <= tolerance:
                merged[-1].append(y)
            else:
                merged.append([y])

        return [int(round(sum(group) / len(group))) for group in merged]

    def _group_into_staffs(self, line_positions: list[int]) -> list[list[int]]:
        """Gom các line gần nhau thành staff 6 dòng."""
        if len(line_positions) < 4:
            return []

        positions = sorted(line_positions)
        gaps = np.diff(positions)
        positive_gaps = [int(g) for g in gaps if 2 <= g <= 80]
        base_gap = float(np.median(positive_gaps)) if positive_gaps else 14.0
        max_gap = max(int(round(base_gap * 1.8)), 12)

        groups: list[list[int]] = []
        current = [positions[0]]
        for y in positions[1:]:
            if y - current[-1] <= max_gap:
                current.append(y)
            else:
                if len(current) >= 4:
                    groups.append(current)
                current = [y]

        if len(current) >= 4:
            groups.append(current)

        staffs: list[list[int]] = []
        for group in groups:
            staffs.extend(self._split_group_into_staffs(group, base_gap))

        return staffs

    def _split_group_into_staffs(self, group: list[int], base_gap: float) -> list[list[int]]:
        if len(group) < 4:
            return []

        staffs: list[list[int]] = []
        max_gap = max(int(round(base_gap * 1.8)), 12)
        idx = 0

        while idx < len(group):
            best_slice = None
            best_score = None

            for size in range(6, 3, -1):
                candidate = group[idx : idx + size]
                if len(candidate) < 4:
                    continue

                candidate_gaps = np.diff(candidate)
                if len(candidate_gaps) == 0:
                    continue
                if np.max(candidate_gaps) > max_gap:
                    continue

                spread = float(np.std(candidate_gaps)) if len(candidate_gaps) > 1 else 0.0
                penalty = abs(6 - len(candidate)) * max(base_gap, 1.0)
                score = spread + penalty

                if best_score is None or score < best_score:
                    best_score = score
                    best_slice = candidate

            if best_slice is None:
                idx += 1
                continue

            staffs.append(self._normalize_staff_lines(best_slice))
            idx += len(best_slice)

        return staffs

    def _normalize_staff_lines(self, line_ys: list[int]) -> list[int]:
        ordered = sorted(line_ys)
        if len(ordered) == 6:
            return ordered

        if len(ordered) > 6:
            best_window = ordered[:6]
            best_score = self._spacing_score(best_window)
            for start in range(1, len(ordered) - 5):
                window = ordered[start : start + 6]
                score = self._spacing_score(window)
                if score < best_score:
                    best_score = score
                    best_window = window
            return best_window

        if len(ordered) == 5:
            diffs = np.diff(ordered)
            spacing = float(np.median(diffs)) if len(diffs) else 14.0
            if ordered[0] > spacing * 0.75:
                top_candidate = int(round(ordered[0] - spacing))
                return sorted([top_candidate, *ordered])
            bottom_candidate = int(round(ordered[-1] + spacing))
            return sorted([*ordered, bottom_candidate])

        return ordered

    def _spacing_score(self, line_ys: list[int]) -> float:
        diffs = np.diff(sorted(line_ys))
        if len(diffs) == 0:
            return float("inf")
        return float(np.std(diffs) + abs(6 - len(line_ys)) * 10)

    def _build_staff_summary(self, staff_id: int, line_ys: list[int]) -> dict:
        """Xây dựng summary cho một staff."""
        spacing = float(np.mean(np.diff(line_ys))) if len(line_ys) >= 2 else 20.0
        return {
            "staff_id": staff_id,
            "line_ys": line_ys,
            "spacing": spacing,
            "source": "line_processor",
            "top_y": min(line_ys),
            "bottom_y": max(line_ys),
        }

    def assign_string_to_staff(
        self, center_y: float, staff: dict
    ) -> tuple[int, float]:
        """
        Gán string_id (0-5) cho một note dựa trên khoảng cách
        tới các line trong staff.

        Args:
            center_y: tung độ tâm của note
            staff: thông tin staff

        Returns:
            (string_id, string_distance)
        """
        line_ys = staff["line_ys"]
        distances = [abs(center_y - ly) for ly in line_ys]
        string_id = int(np.argmin(distances))
        return string_id, float(distances[string_id])
