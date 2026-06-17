"""
DetectorService — gọi mô hình nhận diện tablature (YOLO).

Sử dụng ultralytics YOLO để phát hiện các ký tự số trên tablature.
Mỗi detection trả về dict với các trường:
  - bbox: [x1, y1, x2, y2]
  - confidence: float (0–1)
  - predicted_class_name: tên class từ model (ví dụ "B_3")
  - center_x, center_y: tọa độ tâm bbox
"""

import os

import numpy as np


class DetectorService:
    def __init__(self, model_path: str = None):
        self.model = None
        self.model_path = model_path

    def load_model(self):
        """Nạp model YOLO vào bộ nhớ khi server khởi động."""
        if self.model_path and os.path.exists(self.model_path):
            from ultralytics import YOLO
            self.model = YOLO(self.model_path)
        else:
            raise RuntimeError(
                f"Model file not found at: {self.model_path}"
            )

    def detect(self, image: np.ndarray) -> list[dict]:
        """
        Nhận diện tất cả các ký tự số trong ảnh bằng YOLO.

        Args:
            image: ảnh numpy array (BGR)

        Returns:
            List of detection dicts
        """
        if self.model is None:
            raise RuntimeError(
                f"Model not loaded. Check that best.pt exists at: {self.model_path}"
            )

        results = self.model.predict(image, verbose=False)
        return self._parse_results(results)

    def _parse_results(self, results) -> list[dict]:
        """Parse kết quả từ YOLO."""
        detections = []
        for r in results:
            boxes = r.boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])
                cls_name = self.model.names[cls_id]
                detections.append({
                    "bbox": [float(x1), float(y1), float(x2), float(y2)],
                    "confidence": conf,
                    "predicted_class_name": cls_name,
                    "center_x": float((x1 + x2) / 2),
                    "center_y": float((y1 + y2) / 2),
                })
        return detections
