# Flask AI API

Flask API cho pipeline nhận diện guitar tablature từ ảnh, dùng YOLO `best.pt`, hậu xử lý staff/string/fret, xuất structured JSON và render lại thành ASCII tab hoặc grid cho website.

## Tính năng
- `GET /health`: kiểm tra trạng thái server
- `POST /api/tab/detect`: nhận ảnh tablature, chạy nhận diện YOLO + hậu xử lý + xuất JSON
- `POST /api/tab/render`: nhận structured JSON và render ra ASCII tab + grid editor
- `POST /api/tab/save`: lưu JSON đã chỉnh sửa
- `GET /api/tab/<tab_id>`: đọc lại JSON đã lưu

## Cấu trúc thư mục
- `app.py`: entrypoint Flask
- `config.py`: cấu hình chung
- `services/`
  - `detector.py`: load và chạy YOLO `best.pt`
  - `line_processor.py`: tìm line/staff tablature từ ảnh
  - `postprocess.py`: gán lại string, deduplicate, gom event
  - `json_builder.py`: build structured JSON
  - `renderer.py`: render JSON thành ASCII tab / grid
- `routes/`: endpoint API
- `utils/`: helper file và response
- `uploads/`: ảnh upload
- `outputs/`: JSON đầu ra

## Yêu cầu
- Python 3.10+
- File model `best.pt` đặt ở thư mục gốc project hoặc đặt biến môi trường `MODEL_PATH`

## Cài đặt
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## Kiểm tra server
```bash
curl http://127.0.0.1:5000/health
```

## Detect ảnh tablature
```bash
curl -X POST http://127.0.0.1:5000/api/tab/detect ^
  -F "image=@C:\path\to\your\tab-image.png"
```

## Render JSON thành ASCII tab
```bash
curl -X POST http://127.0.0.1:5000/api/tab/render ^
  -H "Content-Type: application/json" ^
  --data-binary "@C:\path\to\result.json"
```

## Structured JSON đầu ra
JSON trả về từ `/api/tab/detect` có các phần chính:
- `metadata`: thông tin tổng quan, số staff, số note, số event
- `notes`: note-level data sau dedup
- `staffs`: dữ liệu theo từng staff, chứa `events`
- `events`: danh sách phẳng các event toàn bài

Mỗi `event` có:
- `notes`: danh sách note trong cùng time-slot/chord-column
- `string_fret_map`: map `{ "e": "0", "B": null, ... }`
- `string_note_id_map`: map note id theo string

## Lưu ý tích hợp
- Model YOLO được load trong `services/detector.py`
- Đường dẫn model đọc từ `config.py` qua `MODEL_PATH`
- Nếu API báo lỗi `Model not loaded`, hãy kiểm tra file `best.pt`
- Nếu API báo không detect được staff lines, cần tinh chỉnh `line_processor.py` theo ảnh thực tế của bạn

## Gợi ý frontend
Frontend nên dùng `staffs[].events[]` hoặc `grid` từ `/api/tab/render` để dựng tab editor:
- 6 hàng tương ứng 6 dây
- mỗi cột là một event
- mỗi ô là một fret hoặc rỗng
