"""
Audio routes — endpoints phát nhạc từ note tablature.

Endpoints:
  POST /audio/play        : Tạo file WAV từ tab_id hoặc JSON body, trả về WAV
  POST /audio/play-server : Phát trực tiếp (server-side) nếu môi trường hỗ trợ
  GET  /audio/info        : Thông tin cấu hình audio service
  POST /audio/preview     : Trả về metadata (duration, num_chords, ...) không tạo WAV
"""

import io
from pathlib import Path

from flask import Blueprint, Response, current_app, request, send_file

from services import AudioService
from utils import error_response, success_response


audio_bp = Blueprint("audio", __name__)


def get_audio_service() -> AudioService:
    """Lấy AudioService đã được khởi tạo trong app extensions."""
    return current_app.extensions["services"]["audio"]


def _parse_tab_payload() -> dict | None:
    """
    Lấy tab data từ request. Ưu tiên JSON body, fallback theo tab_id trỏ tới file JSON
    đã được lưu trong output folder.
    """
    payload = request.get_json(silent=True)
    if payload:
        return payload

    tab_id = request.args.get("tab_id") or request.form.get("tab_id")
    if tab_id:
        output_dir = Path(current_app.config["OUTPUT_FOLDER"])
        target = output_dir / f"{tab_id}.json"
        if target.exists():
            import json
            return json.loads(target.read_text(encoding="utf-8"))
        return None

    return None


def _resolve_audio_params() -> dict:
    """
    Đọc audio params từ query/body, có default hợp lý.
    Returns dict với: note_duration, silence_between, bpm, strum_ms, pick_position, use_beat_timing
    """
    params = {
        "note_duration": 0.5,
        "silence_between": 0.05,
        "bpm": None,  # sẽ lấy từ service default
        "strum_ms": None,
        "pick_position": None,
        "use_beat_timing": True,
    }

    body: dict = {}
    if request.is_json:
        body = request.get_json(silent=True) or {}

    def _set(name, cast=float, default=None):
        try:
            if name in body:
                return cast(body[name])
        except (TypeError, ValueError):
            pass
        try:
            if name in request.args:
                return cast(request.args[name])
        except (TypeError, ValueError):
            pass
        return default

    params["note_duration"] = _set("note_duration", float, 0.5)
    params["silence_between"] = _set("silence_between", float, 0.05)
    params["bpm"] = _set("bpm", float, None)
    params["strum_ms"] = _set("strum_ms", float, None)
    params["pick_position"] = _set("pick_position", float, None)
    use_beat = _set("use_beat_timing", lambda v: str(v).lower() not in ("0", "false", "no"), True)
    params["use_beat_timing"] = use_beat

    # Clamp
    params["note_duration"] = max(0.05, min(params["note_duration"], 5.0))
    params["silence_between"] = max(0.0, min(params["silence_between"], 2.0))
    if params["bpm"] is not None:
        params["bpm"] = max(20.0, min(params["bpm"], 300.0))
    if params["strum_ms"] is not None:
        params["strum_ms"] = max(0.0, min(params["strum_ms"], 100.0))
    if params["pick_position"] is not None:
        params["pick_position"] = max(0.0, min(params["pick_position"], 1.0))

    return params


@audio_bp.post("/audio/preview")
def audio_preview():
    """
    Trả về metadata của audio mà sẽ được tạo, KHÔNG render WAV.
    Dùng cho client để hiển thị "X giây, Y chord, Z dây" trước khi user bấm play.

    Body (JSON): {"events": [...], "notes": [...], "bpm": 100}  hoặc  ?tab_id=<id>
    Query params: bpm, strum_ms, pick_position, use_beat_timing
    """
    tab_data = _parse_tab_payload()
    if tab_data is None:
        return error_response(
            "Missing tab data",
            details="Provide JSON body with 'notes'/'events' or pass ?tab_id=<id>",
            status_code=400,
        )

    audio_service: AudioService = get_audio_service()
    params = _resolve_audio_params()
    effective_bpm = params["bpm"] or float(tab_data.get("bpm", audio_service.bpm))

    summary = audio_service.get_tab_summary(tab_data)
    summary["effective_bpm"] = effective_bpm
    summary["sample_rate"] = audio_service.sample_rate
    summary["options"] = {
        "strum_ms": params["strum_ms"] if params["strum_ms"] is not None else audio_service.strum_ms,
        "pick_position": params["pick_position"] if params["pick_position"] is not None else audio_service.pick_position,
        "use_beat_timing": params["use_beat_timing"],
    }
    return success_response(summary, message="Audio preview metadata")


@audio_bp.post("/audio/play")
def play_audio():
    """
    Tạo file WAV từ tab data và trả về audio/wav.

    Body (JSON) - một trong hai dạng:
      1) {"notes": [...]}                  # danh sách notes thuần
      2) {"events": [...], "notes": [...]}  # full tab output

    Hoặc truyền tab_id=?  (tham chiếu file JSON đã lưu trong outputs/).

    Query params (optional):
      - note_duration (giây mỗi note, mặc định 0.5)
      - silence_between (giây lặng giữa các note, mặc định 0.05)
      - bpm (tempo, mặc định 100 hoặc lấy từ tab_data.bpm)
      - strum_ms (delay giữa các dây chord, mặc định 12ms)
      - pick_position (0=cầu..1=phím, mặc định 0.35)
      - use_beat_timing (1/0, mặc định 1)
      - save=1 (lưu file WAV vào outputs/<tab_id>.wav)
    """
    tab_data = _parse_tab_payload()
    if tab_data is None:
        return error_response(
            "Missing tab data",
            details="Provide JSON body with 'notes'/'events' or pass ?tab_id=<id>",
            status_code=400,
        )

    params = _resolve_audio_params()
    audio_service: AudioService = get_audio_service()

    try:
        wav_bytes = audio_service.build_wav_from_tab(
            tab_data,
            note_duration=params["note_duration"],
            silence_between=params["silence_between"],
            bpm=params["bpm"],
            strum_ms=params["strum_ms"],
            pick_position=params["pick_position"],
            use_beat_timing=params["use_beat_timing"],
        )
    except Exception as exc:
        return error_response(
            "Failed to build audio",
            details=str(exc),
            status_code=500,
        )

    # Tùy chọn lưu file WAV
    saved_path = None
    if request.args.get("save") in ("1", "true", "True"):
        tab_id = tab_data.get("tab_id") or request.args.get("tab_id")
        if tab_id:
            saved_path = audio_service.save_wav(wav_bytes, f"{tab_id}.wav")

    headers = {
        "Content-Disposition": 'attachment; filename="tablature.wav"',
        "X-Note-Duration": str(params["note_duration"]),
        "X-Silence-Between": str(params["silence_between"]),
        "X-Audio-Bytes": str(len(wav_bytes)),
        "X-BPM": str(params["bpm"] or float(tab_data.get("bpm", audio_service.bpm))),
    }
    if saved_path:
        headers["X-Saved-Path"] = saved_path

    return Response(
        wav_bytes,
        mimetype="audio/wav",
        headers=headers,
    )


@audio_bp.post("/audio/play-server")
def play_audio_server():
    """
    Phát âm thanh trực tiếp trên server (chỉ hoạt động khi có audio device).
    Thường chỉ dùng cho dev local, server production sẽ trả về not_supported.
    """
    tab_data = _parse_tab_payload()
    if tab_data is None:
        return error_response("Missing tab data", status_code=400)

    params = _resolve_audio_params()
    audio_service: AudioService = get_audio_service()

    try:
        wav_bytes = audio_service.build_wav_from_tab(
            tab_data,
            note_duration=params["note_duration"],
            silence_between=params["silence_between"],
            bpm=params["bpm"],
            strum_ms=params["strum_ms"],
            pick_position=params["pick_position"],
            use_beat_timing=params["use_beat_timing"],
        )
    except Exception as exc:
        return error_response("Failed to build audio", details=str(exc), status_code=500)

    played = audio_service.play_wav_bytes(wav_bytes)
    if not played:
        return success_response(
            {
                "played": False,
                "reason": "No audio backend available (pygame/simpleaudio not installed or no audio device). "
                          "Use POST /audio/play to download the WAV file.",
            },
            message="Audio playback not supported in this environment",
            status_code=200,
        )

    return success_response({"played": True}, message="Audio playback started")


@audio_bp.get("/audio/info")
def audio_info():
    """Thông tin cấu hình AudioService."""
    audio_service: AudioService = get_audio_service()
    return success_response(
        {
            "sample_rate": audio_service.sample_rate,
            "output_dir": str(audio_service.output_dir) if audio_service.output_dir else None,
            "default_bpm": audio_service.bpm,
            "default_strum_ms": audio_service.strum_ms,
            "default_pick_position": audio_service.pick_position,
            "tuning": {
                "e": 64,  # E4
                "B": 59,  # B3
                "G": 55,  # G3
                "D": 50,  # D3
                "A": 45,  # A2
                "E": 40,  # E2
            },
            "endpoints": {
                "play": "POST /api/audio/play",
                "play_server": "POST /api/audio/play-server",
                "preview": "POST /api/audio/preview",
            },
        },
        message="Audio service info",
    )
