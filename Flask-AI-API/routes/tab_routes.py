import json
from pathlib import Path
from uuid import uuid4

import cv2
from flask import Blueprint, current_app, request

from services import (
    AudioService,
    DetectionVisualizer,
    DetectorService,
    JSONBuilder,
    LineProcessor,
    PostProcessor,
    TabRenderer,
)
from utils import allowed_file, build_safe_filename, ensure_directory, error_response, success_response


tab_bp = Blueprint("tab", __name__)


def get_services():
    return current_app.extensions["services"]


@tab_bp.post("/tab/detect")
def detect_tab():
    if "image" not in request.files:
        return error_response("Missing image file", status_code=400)

    file = request.files["image"]
    if file.filename == "":
        return error_response("Empty filename", status_code=400)

    allowed_extensions = current_app.config["ALLOWED_EXTENSIONS"]
    if not allowed_file(file.filename, allowed_extensions):
        return error_response("Unsupported image format", status_code=415)

    upload_dir = current_app.config["UPLOAD_FOLDER"]
    ensure_directory(upload_dir)
    safe_name = build_safe_filename(file.filename)
    saved_path = str(Path(upload_dir) / safe_name)
    file.save(saved_path)

    image = cv2.imread(saved_path)
    if image is None:
        return error_response("Could not read uploaded image", status_code=422)

    services = get_services()
    detector: DetectorService = services["detector"]
    line_processor: LineProcessor = services["line_processor"]
    post_processor: PostProcessor = services["post_processor"]
    json_builder: JSONBuilder = services["json_builder"]
    visualizer: DetectionVisualizer = services["visualizer"]
    audio_service: AudioService = services["audio"]

    try:
        detections = detector.detect(image)
    except Exception as exc:
        return error_response("Detection failed", details=str(exc), status_code=500)

    staffs = line_processor.detect_staffs(image)
    if not staffs:
        return error_response(
            "Could not detect tablature staff lines",
            details="Line processor returned no staffs",
            status_code=422,
        )

    processed_notes = post_processor.process(detections, staffs)
    notes_with_ids = []
    for idx, note in enumerate(processed_notes):
        note_copy = dict(note)
        note_copy["note_id"] = f"s{note_copy['staff_id']:03d}_n{idx:04d}"
        notes_with_ids.append(note_copy)

    events = post_processor.group_into_events(notes_with_ids, staffs)

    output_json = json_builder.build(
        staffs_data=staffs,
        deduped_notes=notes_with_ids,
        events=events,
        metadata_extra={
            "filename": file.filename,
            "image_width": int(image.shape[1]),
            "image_height": int(image.shape[0]),
            "raw_note_count": len(detections),
        },
    )

    output_dir = current_app.config["OUTPUT_FOLDER"]
    ensure_directory(output_dir)
    tab_id = uuid4().hex
    output_filename = f"{tab_id}.json"
    output_path = Path(output_dir) / output_filename
    output_path.write_text(json.dumps(output_json, indent=2, ensure_ascii=False), encoding="utf-8")

    annotated_filename = f"{tab_id}_annotated.jpg"
    annotated_path = Path(output_dir) / annotated_filename
    visualizer.annotate(
        image=image,
        detections=detections,
        staffs=staffs,
        processed_notes=notes_with_ids,
        output_path=annotated_path,
    )

    # Tự động tổng hợp audio từ note đã nhận diện
    audio_filename = None
    audio_path = None
    audio_url = None
    audio_error = None
    try:
        wav_bytes = audio_service.build_wav_from_tab(output_json)
        audio_filename = f"{tab_id}.wav"
        audio_path = audio_service.save_wav(wav_bytes, audio_filename)
        if audio_path:
            audio_url = f"/outputs/{audio_filename}"
    except Exception as exc:
        audio_error = str(exc)

    response_data = {
        "tab_id": tab_id,
        "result": output_json,
        "saved_json_path": str(output_path),
        "uploaded_image_path": saved_path,
        "annotated_image_path": str(annotated_path),
        "audio": {
            "available": audio_path is not None,
            "audio_url": audio_url,
            "audio_path": audio_path,
            "filename": audio_filename,
            "error": audio_error,
        },
    }
    return success_response(response_data, message="Detection completed")


@tab_bp.post("/tab/render")
def render_tab():
    payload = request.get_json(silent=True)
    if not payload:
        return error_response("Missing JSON body", status_code=400)

    services = get_services()
    renderer: TabRenderer = services["renderer"]

    ascii_tab = renderer.render_from_json(payload)
    grid = renderer.render_grid(payload)

    return success_response(
        {
            "ascii_tab": ascii_tab,
            "grid": grid,
        },
        message="Render completed",
    )


@tab_bp.post("/tab/save")
def save_tab():
    payload = request.get_json(silent=True)
    if not payload:
        return error_response("Missing JSON body", status_code=400)

    output_dir = current_app.config["OUTPUT_FOLDER"]
    ensure_directory(output_dir)
    tab_id = uuid4().hex
    output_path = Path(output_dir) / f"{tab_id}.json"
    output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    return success_response(
        {
            "tab_id": tab_id,
            "saved_path": str(output_path),
        },
        message="Tab saved successfully",
        status_code=201,
    )


@tab_bp.get("/tab/<tab_id>")
def get_tab(tab_id: str):
    output_dir = Path(current_app.config["OUTPUT_FOLDER"])
    target_path = output_dir / f"{tab_id}.json"
    if not target_path.exists():
        return error_response("Tab not found", status_code=404)

    data = json.loads(target_path.read_text(encoding="utf-8"))
    return success_response(data, message="Tab loaded")
