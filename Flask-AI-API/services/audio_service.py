"""
AudioService — tổng hợp và phát âm thanh guitar từ các note đã nhận diện.

Tính năng:
  1. Tổng hợp âm thanh pluck guitar bằng Karplus-Strong algorithm (cải tiến)
  2. Chuyển đổi (string, fret) → tần số Hz theo tuning chuẩn EADGBE
  3. Polyphony: phát nhiều dây cùng lúc (chord)
  4. Strum delay: gảy dây lệch nhau vài ms cho cảm giác tự nhiên
  5. Pick position filter: gảy gần cầu sáng, giữa cần dịu
  6. Beat-based timing: dùng event_index + duration làm thời lượng thật
  7. Xuất file WAV và phát trực tiếp (nếu môi trường cho phép)

Lưu ý:
  - File WAV được tạo từ synthesis (không cần file mẫu)
  - Tần số dựa trên A4 = 440 Hz
  - Tuning chuẩn: E2-A2-D3-G3-B3-E4 (thấp → cao)
"""

import io
import math
import struct
import threading
import wave
from pathlib import Path
from typing import Iterable

import numpy as np


# Standard guitar tuning: low E (string 6) -> high e (string 1)
# Theo thứ tự từ trên xuống dưới trong tab: e B G D A E
STRING_OPEN_MIDI = {
    "e": 64,  # high E4
    "B": 59,  # B3
    "G": 55,  # G3
    "D": 50,  # D3
    "A": 45,  # A2
    "E": 40,  # low E2
}

STRING_ORDER = ["e", "B", "G", "D", "A", "E"]
STRING_OPEN_HZ = {s: 440.0 * (2 ** ((m - 69) / 12.0)) for s, m in STRING_OPEN_MIDI.items()}

SAMPLE_RATE = 44100  # Hz, chuẩn CD quality
DEFAULT_BPM = 100.0
DEFAULT_STRUM_MS = 12.0  # ms giữa các dây khi strum chord
DEFAULT_PICK_POS = 0.35  # 0=cầu (sáng), 1=phím (dịu), mặc định hơi gần cầu


def midi_to_frequency(midi_note: int) -> float:
    """Chuyển MIDI note number sang tần số Hz (A4=440)."""
    return 440.0 * (2 ** ((midi_note - 69) / 12.0))


def fret_to_midi(string: str, fret: int) -> int:
    """
    Tính MIDI note từ (string, fret) theo tuning chuẩn.
    string là một trong ['e', 'B', 'G', 'D', 'A', 'E'].
    """
    if string not in STRING_OPEN_MIDI:
        raise ValueError(f"Unknown string {string!r}. Expected one of {STRING_ORDER}")
    if fret < 0:
        raise ValueError(f"Fret must be >= 0, got {fret}")
    if fret > 24:
        raise ValueError(f"Fret too high ({fret}). Max 24 frets supported.")
    return STRING_OPEN_MIDI[string] + int(fret)


def fret_to_frequency(string: str, fret: int) -> float:
    """Tính tần số Hz từ (string, fret)."""
    return midi_to_frequency(fret_to_midi(string, fret))


def _karplus_strong_pluck(
    frequency: float,
    duration: float,
    sample_rate: int = SAMPLE_RATE,
    pick_position: float = DEFAULT_PICK_POS,
    velocity: float = 0.8,
) -> np.ndarray:
    """
    Tổng hợp âm thanh pluck guitar bằng Additive Synthesis (sine + harmonics).

    Implementation: cộng các sine wave ở tần số f, 2f, 3f, 4f, 5f với
    biên độ giảm dần + ADSR envelope để tạo cảm giác "pluck".

    Lý do bỏ Karplus-Strong: KS có vấn đề về comb filter khiến pitch
    lệch 1 octave ở một số tần số (do period integer rounding). Sine
    additive cho pitch CHÍNH XÁC 100% và nghe tự nhiên với envelope phù hợp.

    Args:
        frequency: tần số Hz (chính xác)
        duration: thời lượng (giây)
        sample_rate: tần số lấy mẫu
        pick_position: 0.0=cầu (bright, nhiều harmonics) → 1.0=phím (mellow, ít harmonics)
        velocity: cường độ gảy 0..1

    Returns:
        numpy array float32 trong [-1, 1]
    """
    if frequency <= 0 or duration <= 0:
        return np.zeros(int(duration * sample_rate), dtype=np.float32)

    num_samples = int(duration * sample_rate)
    if num_samples <= 0:
        return np.zeros(0, dtype=np.float32)

    t = np.arange(num_samples, dtype=np.float32) / sample_rate

    # Pick position điều chỉnh số lượng và biên độ harmonics
    # pp=0 (cầu, bright): nhiều harmonics mạnh → âm sắc sáng
    # pp=1 (phím, mellow): ít harmonics → âm sắc dịu
    pp = float(np.clip(pick_position, 0.0, 1.0))

    # Hệ số harmonics: (multiplier, amplitude) theo pp
    # Bright (pp=0): 1, 0.5, 0.3, 0.2, 0.1
    # Mellow (pp=1): 1, 0.2, 0.05, 0, 0
    harmonics_config = [
        (1.0, 1.00),
        (2.0, 0.50 - 0.30 * pp),
        (3.0, 0.30 - 0.25 * pp),
        (4.0, 0.20 - 0.20 * pp),
        (5.0, 0.10 - 0.10 * pp),
    ]

    # Tổng hợp additive
    sig = np.zeros(num_samples, dtype=np.float32)
    for mult, amp in harmonics_config:
        if amp <= 0.001:
            continue
        # Tránh aliasing: bỏ harmonic vượt Nyquist
        if frequency * mult > sample_rate * 0.45:
            break
        sig += amp * np.sin(2 * np.pi * frequency * mult * t)

    # ADSR envelope (giả lập pluck)
    envelope = _adsr_envelope(num_samples, sample_rate, velocity=velocity)
    sig = sig * envelope

    # Normalize
    max_val = np.max(np.abs(sig))
    if max_val > 0:
        sig = sig / max_val * 0.85 * velocity

    return sig.astype(np.float32)


def _adsr_envelope(num_samples: int, sample_rate: int = SAMPLE_RATE, velocity: float = 0.8) -> np.ndarray:
    """
    Tạo envelope ADSR (Attack, Decay, Sustain, Release) cho âm thanh pluck.
    Velocity điều chỉnh sustain level (đánh mạnh → ngân lâu hơn).
    """
    attack = int(0.005 * sample_rate)   # 5ms
    decay = int(0.050 * sample_rate)    # 50ms
    release = int(0.300 * sample_rate)  # 300ms

    sustain_level = 0.4 + 0.4 * velocity  # 0.72..0.8 tuỳ velocity

    envelope = np.ones(num_samples, dtype=np.float32) * sustain_level

    # Attack: 0 -> 1
    a_end = min(attack, num_samples)
    if a_end > 0:
        envelope[:a_end] = np.linspace(0, 1, a_end, dtype=np.float32)

    # Decay: 1 -> sustain_level
    d_end = min(attack + decay, num_samples)
    if d_end > a_end:
        envelope[a_end:d_end] = np.linspace(1, sustain_level, d_end - a_end, dtype=np.float32)

    # Release: sustain_level -> 0
    r_start = max(d_end, num_samples - release)
    if num_samples > r_start:
        envelope[r_start:] = np.linspace(sustain_level, 0, num_samples - r_start, dtype=np.float32)

    return envelope


def _note_dict_to_midi(note: dict) -> tuple[str, int] | None:
    """
    Trích (string, fret) từ 1 note dict. Trả về None nếu không hợp lệ.
    """
    string = (
        note.get("corrected_string")
        or note.get("string")
        or note.get("predicted_string", "")
    )
    fret_raw = note.get("fret")
    if fret_raw is None:
        fret_raw = note.get("predicted_fret", 0)
    try:
        fret = int(fret_raw)
    except (TypeError, ValueError):
        return None
    if not string or string not in STRING_OPEN_MIDI:
        return None
    if fret < 0 or fret > 24:
        return None
    return string, fret


def _dedupe_chord(notes: list[dict]) -> list[dict]:
    """
    Nếu cùng dây xuất hiện 2 lần trong 1 chord (data lỗi từ detector),
    chỉ giữ fret CAO NHẤT (vì thường là ngón tay đèo khi quét sai).
    """
    seen: dict[str, dict] = {}
    for n in notes:
        s = n.get("string")
        if not s:
            continue
        try:
            fret = int(n.get("fret", 0))
        except (TypeError, ValueError):
            continue
        if s not in seen or fret > int(seen[s].get("fret", 0) or 0):
            seen[s] = n
    # Sắp lại theo string_index
    return sorted(seen.values(), key=lambda n: n.get("string_index", 0))


def notes_to_wav_bytes(
    notes_sequence: list[dict],
    note_duration: float = 0.5,
    silence_between: float = 0.05,
    sample_rate: int = SAMPLE_RATE,
    bpm: float = DEFAULT_BPM,
    strum_ms: float = DEFAULT_STRUM_MS,
    pick_position: float = DEFAULT_PICK_POS,
    use_beat_timing: bool = True,
) -> bytes:
    """
    Tổng hợp danh sách note thành file WAV dạng bytes (hỗ trợ polyphony + strum).

    Logic:
      - Nếu các note trong cùng event_index_in_staff (chord), phát đồng thời
        với strum delay giữa các dây (mặc định 12ms).
      - Nếu các note ở event_index khác nhau, phát tuần tự theo beat (1 beat = 60/bpm giây).
      - Nếu không có event_index (flat list), phát tuần tự với note_duration mỗi note.

    Args:
        notes_sequence: list các note (đã sắp theo thứ tự thời gian)
        note_duration: thời lượng mỗi note khi không có beat (giây)
        silence_between: khoảng lặng giữa các note khi không có beat (giây)
        sample_rate: tần số lấy mẫu
        bpm: tempo (nhịp/phút), mặc định 100
        strum_ms: delay giữa các dây trong chord (millisecond)
        pick_position: vị trí gảy (0=cầu, 1=phím)
        use_beat_timing: dùng beat timing nếu có event_index

    Returns:
        bytes của file WAV (16-bit PCM mono)
    """
    if not notes_sequence:
        # Trả về WAV im lặng 0.5s
        silent = np.zeros(int(0.5 * sample_rate), dtype=np.float32)
        return _numpy_to_wav_bytes((silent * 32767).astype(np.int16), sample_rate)

    # Gom note theo (staff_id, event_index_in_staff) → chord
    chord_groups: list[tuple[int, int, list[dict]]] = []
    if use_beat_timing and notes_sequence and "event_index_in_staff" in notes_sequence[0]:
        from collections import OrderedDict
        groups: dict[tuple[int, int], list[dict]] = OrderedDict()
        for n in notes_sequence:
            staff = n.get("staff_id", 0)
            ev = n.get("event_index_in_staff", 0)
            groups.setdefault((staff, ev), []).append(n)
        # Sắp theo (staff, event)
        for (staff, ev), grp in groups.items():
            # Sắp dây trong chord: low E → high e (string_index tăng = dây trầm hơn)
            grp_sorted = sorted(grp, key=lambda x: x.get("string_index", 0))
            chord_groups.append((staff, ev, grp_sorted))
    else:
        # Mỗi note = 1 chord
        for i, n in enumerate(notes_sequence):
            chord_groups.append((0, i, [n]))

    beat_sec = 60.0 / max(bpm, 20.0)
    strum_samples = int(strum_ms / 1000.0 * sample_rate)

    # Xác định advance per chord (samples) = duration beat
    # Note: chord ở đây nghĩa là 1 beat (1 event_index_in_staff)
    advance_per_chord = int(beat_sec * sample_rate) if use_beat_timing else int(note_duration * sample_rate)

    timeline: list[np.ndarray] = []
    cursor = 0  # sample position đã viết tới
    pending_padding = 0  # số sample cần pad trước chord tiếp theo

    for idx, (_staff, _ev, chord_notes) in enumerate(chord_groups):
        # Dedupe: nếu cùng dây trong 1 chord → giữ fret cao nhất
        chord_notes = _dedupe_chord(chord_notes)
        if not chord_notes:
            # Empty chord: vẫn advance cursor để giữ timing
            cursor += advance_per_chord
            continue

        # Xác định duration của chord
        if use_beat_timing and "duration_beats" in chord_notes[0]:
            dur_beats = max(1.0, float(chord_notes[0].get("duration_beats", 1.0)))
            chord_dur = dur_beats * beat_sec
        else:
            chord_dur = note_duration

        # Strum: từng dây trong chord cách nhau strum_samples
        if len(chord_notes) == 1:
            delays = [0]
        else:
            delays = [i * strum_samples for i in range(len(chord_notes))]

        # Tính max delay (sẽ là offset đầu chord so với cursor)
        max_delay = max(delays)

        # Pad trước chord tới cursor (chứa silence từ chord trước)
        if cursor < advance_per_chord and idx > 0:
            # Chord trước ngân đến cuối beat này
            pass
        # Append silence padding (nếu có)
        if pending_padding > 0:
            timeline.append(np.zeros(pending_padding, dtype=np.float32))
            pending_padding = 0

        # Tính duration mỗi dây
        pluck_signals: list[tuple[int, np.ndarray]] = []
        for note, delay in zip(chord_notes, delays):
            parsed = _note_dict_to_midi(note)
            if parsed is None:
                continue
            string, fret = parsed
            try:
                freq = fret_to_frequency(string, fret)
            except ValueError:
                continue
            velocity = float(note.get("velocity", 0.8))
            sig = _karplus_strong_pluck(
                freq, chord_dur, sample_rate,
                pick_position=pick_position, velocity=velocity,
            )
            pluck_signals.append((delay, sig))

        # Mix chord (offset dựa trên cursor, không phải 0)
        if pluck_signals:
            # Tính max length chord buffer
            max_len = max(d + len(s) for d, s in pluck_signals)
            chord_buf = np.zeros(max_len, dtype=np.float32)
            for d, s in pluck_signals:
                chord_buf[d:d + len(s)] += s
            # Không normalize chord tổng tại đây — để master normalize ở cuối
            # (tránh scale-down dây yếu khi có dây mạnh)
            timeline.append(chord_buf)

        # Pad ngân dài đến hết beat
        chord_written = max_len if pluck_signals else 0
        rest_of_beat = max(0, advance_per_chord - chord_written)
        pending_padding = rest_of_beat

        # Advance cursor
        cursor += advance_per_chord

    # Append trailing padding
    if pending_padding > 0:
        timeline.append(np.zeros(pending_padding, dtype=np.float32))

    if not timeline:
        silent = np.zeros(int(0.5 * sample_rate), dtype=np.float32)
        return _numpy_to_wav_bytes((silent * 32767).astype(np.int16), sample_rate)

    full_signal = np.concatenate(timeline)

    # Master normalize nhẹ để tránh clipping
    peak = np.max(np.abs(full_signal))
    if peak > 0.95:
        full_signal = full_signal * (0.95 / peak)

    # Convert float32 -> int16 PCM
    pcm_data = (full_signal * 32767).astype(np.int16)
    return _numpy_to_wav_bytes(pcm_data, sample_rate)


def _numpy_to_wav_bytes(pcm_data: np.ndarray, sample_rate: int) -> bytes:
    """Encode numpy PCM array sang WAV bytes (16-bit mono)."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(sample_rate)
        wf.writeframes(pcm_data.tobytes())
    return buf.getvalue()


def extract_notes_in_order(notes_or_events: list[dict]) -> list[dict]:
    """
    Trích xuất thứ tự note để phát từ:
      - danh sách notes (có staff_id, x, y, ...)
      - hoặc danh sách events (có notes lồng nhau, event_index_in_staff)
    Ưu tiên sắp xếp theo staff_id -> event_index -> string_index.

    Mỗi note được thêm/giữ các field:
      - staff_id, event_index_in_staff, string_index, duration_beats
    để beat-based timing hoạt động đúng.
    """
    if not notes_or_events:
        return []

    flat: list[dict] = []

    # Nếu là events (mỗi item có 'notes' lồng nhau)
    if isinstance(notes_or_events[0], dict) and "notes" in notes_or_events[0]:
        # Lấy duration_beats từ event cha (nếu có)
        sorted_events = sorted(
            notes_or_events,
            key=lambda e: (e.get("staff_id", 0), e.get("event_index_in_staff", 0)),
        )
        for evt in sorted_events:
            dur_beats = evt.get("duration_beats", 1.0)
            for n in sorted(evt["notes"], key=lambda n: n.get("string_index", 0)):
                note = dict(n)  # copy
                note.setdefault("staff_id", evt.get("staff_id", 0))
                note.setdefault("event_index_in_staff", evt.get("event_index_in_staff", 0))
                note.setdefault("duration_beats", dur_beats)
                flat.append(note)
        return flat

    # Nếu là notes thuần
    return sorted(
        notes_or_events,
        key=lambda n: (n.get("staff_id", 0), n.get("x", 0.0), n.get("corrected_string_index", 0)),
    )


class AudioService:
    """
    Service tổng hợp và phát âm thanh từ các note tablature.

    Methods:
        build_wav_from_tab(tab_data, **opts) -> bytes
        build_wav_from_notes(notes, **opts) -> bytes
        get_tab_summary(tab_data) -> dict    # metadata cho client
        play_wav_bytes(wav_bytes) -> bool
    """

    def __init__(
        self,
        output_dir: str | None = None,
        sample_rate: int = SAMPLE_RATE,
        bpm: float = DEFAULT_BPM,
        strum_ms: float = DEFAULT_STRUM_MS,
        pick_position: float = DEFAULT_PICK_POS,
    ):
        """
        Args:
            output_dir: thư mục lưu file WAV (nếu muốn lưu lại)
            sample_rate: tần số lấy mẫu
            bpm: tempo mặc định (nhịp/phút)
            strum_ms: delay giữa các dây khi strum chord (ms)
            pick_position: vị trí gảy 0..1 (0=cầu bright, 1=phím mellow)
        """
        self.output_dir = Path(output_dir) if output_dir else None
        self.sample_rate = sample_rate
        self.bpm = bpm
        self.strum_ms = strum_ms
        self.pick_position = pick_position
        self._player_lock = threading.Lock()

    def _merge_opts(self, **user_opts) -> dict:
        """Merge user options với defaults của service."""
        return {
            "note_duration": user_opts.get("note_duration", 0.5),
            "silence_between": user_opts.get("silence_between", 0.05),
            "sample_rate": user_opts.get("sample_rate", self.sample_rate),
            "bpm": user_opts.get("bpm", self.bpm),
            "strum_ms": user_opts.get("strum_ms", self.strum_ms),
            "pick_position": user_opts.get("pick_position", self.pick_position),
            "use_beat_timing": user_opts.get("use_beat_timing", True),
        }

    def build_wav_from_tab(
        self,
        tab_data: dict,
        note_duration: float = 0.5,
        silence_between: float = 0.05,
        bpm: float | None = None,
        strum_ms: float | None = None,
        pick_position: float | None = None,
        use_beat_timing: bool = True,
    ) -> bytes:
        """
        Tạo file WAV từ dữ liệu tab (output JSON của /tab/detect).

        Args:
            tab_data: dict có key 'events' hoặc 'notes'
            note_duration: thời lượng mỗi note khi không có beat (giây)
            silence_between: lặng giữa các note khi không có beat
            bpm: tempo (mặc định = self.bpm)
            strum_ms: strum delay giữa các dây chord (ms)
            pick_position: vị trí gảy 0..1
            use_beat_timing: dùng beat timing từ event_index (khuyến nghị True)

        Returns:
            bytes của file WAV (16-bit PCM mono)
        """
        events = tab_data.get("events") or []
        notes = tab_data.get("notes") or []

        if events:
            ordered_notes = extract_notes_in_order(events)
        else:
            ordered_notes = extract_notes_in_order(notes)

        # Lấy BPM từ tab_data nếu có
        effective_bpm = bpm if bpm is not None else tab_data.get("bpm", self.bpm)

        return notes_to_wav_bytes(
            ordered_notes,
            note_duration=note_duration,
            silence_between=silence_between,
            sample_rate=self.sample_rate,
            bpm=float(effective_bpm),
            strum_ms=strum_ms if strum_ms is not None else self.strum_ms,
            pick_position=pick_position if pick_position is not None else self.pick_position,
            use_beat_timing=use_beat_timing,
        )

    def build_wav_from_notes(
        self,
        notes: list[dict],
        note_duration: float = 0.5,
        silence_between: float = 0.05,
        bpm: float | None = None,
        strum_ms: float | None = None,
        pick_position: float | None = None,
        use_beat_timing: bool = True,
    ) -> bytes:
        """Tạo file WAV từ danh sách notes thuần."""
        ordered_notes = extract_notes_in_order(notes)
        return notes_to_wav_bytes(
            ordered_notes,
            note_duration=note_duration,
            silence_between=silence_between,
            sample_rate=self.sample_rate,
            bpm=float(bpm if bpm is not None else self.bpm),
            strum_ms=strum_ms if strum_ms is not None else self.strum_ms,
            pick_position=pick_position if pick_position is not None else self.pick_position,
            use_beat_timing=use_beat_timing,
        )

    def get_tab_summary(self, tab_data: dict) -> dict:
        """
        Trích xuất metadata của tab: số note, số chord, BPM, thời lượng ước tính...
        """
        events = tab_data.get("events") or []
        notes = tab_data.get("notes") or []

        if events:
            ordered = extract_notes_in_order(events)
            num_events = len(events)
            num_chords = num_events
        else:
            ordered = extract_notes_in_order(notes)
            num_events = len(ordered)
            num_chords = len(ordered)

        # Tính duration ước tính
        bpm = float(tab_data.get("bpm", self.bpm))
        if events and "duration_beats" in events[0]:
            total_beats = sum(float(e.get("duration_beats", 1.0)) for e in events)
        else:
            total_beats = float(num_events)
        duration_sec = total_beats * 60.0 / max(bpm, 20.0)

        # Đếm note hợp lệ vs note lỗi
        valid = 0
        invalid = 0
        unique_strings = set()
        for n in ordered:
            parsed = _note_dict_to_midi(n)
            if parsed is None:
                invalid += 1
            else:
                valid += 1
                unique_strings.add(parsed[0])

        return {
            "num_events": num_events,
            "num_chords": num_chords,
            "num_notes": valid,
            "num_invalid_notes": invalid,
            "strings_used": sorted(unique_strings),
            "bpm": bpm,
            "estimated_duration_sec": round(duration_sec, 2),
            "max_chord_size": max(
                (len(e.get("notes", [])) for e in events), default=1
            ) if events else 1,
        }

    def save_wav(self, wav_bytes: bytes, filename: str) -> str | None:
        """Lưu file WAV vào output_dir nếu được cấu hình. Trả về đường dẫn."""
        if not self.output_dir:
            return None
        self.output_dir.mkdir(parents=True, exist_ok=True)
        path = self.output_dir / filename
        path.write_bytes(wav_bytes)
        return str(path)

    def play_wav_bytes(self, wav_bytes: bytes) -> bool:
        """
        Phát file WAV. Trả về True nếu thành công, False nếu môi trường không hỗ trợ.

        Lưu ý: Trên server (headless) thường không có audio device, sẽ trả về False.
        Trên local, cần cài thêm pygame hoặc simpleaudio.
        """
        with self._player_lock:
            # Thử dùng pygame nếu có
            try:
                import pygame  # type: ignore

                if not pygame.mixer.get_init():
                    pygame.mixer.init(frequency=self.sample_rate, size=-16, channels=1)
                sound = pygame.mixer.Sound(io.BytesIO(wav_bytes))
                sound.play()
                return True
            except Exception:
                pass

            # Thử dùng simpleaudio
            try:
                import simpleaudio  # type: ignore

                play_obj = simpleaudio.play_buffer(
                    _wav_bytes_to_pcm(wav_bytes, self.sample_rate),
                    num_channels=1,
                    bytes_per_sample=2,
                    sample_rate=self.sample_rate,
                )
                play_obj.wait_done()
                return True
            except Exception:
                pass

            return False


def _wav_bytes_to_pcm(wav_bytes: bytes, sample_rate: int) -> np.ndarray:
    """Decode WAV bytes thành numpy int16 array."""
    with wave.open(io.BytesIO(wav_bytes), "rb") as wf:
        assert wf.getframerate() == sample_rate
        assert wf.getnchannels() == 1
        assert wf.getsampwidth() == 2
        raw = wf.readframes(wf.getnframes())
    return np.frombuffer(raw, dtype=np.int16)
