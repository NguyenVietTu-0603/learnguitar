import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppButton from '../components/common/AppButton';
import TabStaffSVG from '../components/tab/TabStaffSVG';
import TabPlaybackControls from '../components/tab/TabPlaybackControls';
import {
  buildAudioFromTab,
  getSavedTab,
  detectTabFromImage,
  saveTab,
} from '../features/tab/tab.service';
import { useTabPlayback } from '../features/tab/useTabPlayback';
import type { TabDetectionResponse, TabDetectionResult } from '../features/tab/tab.types';
import { computeDetectionStats, normalizeDetectionResult } from '../features/tab/tab.utils';

export default function TabImagePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [detectResult, setDetectResult] = useState<TabDetectionResult | null>(null);
  const [detectAssets, setDetectAssets] = useState<Pick<TabDetectionResponse, 'saved_json_path' | 'uploaded_image_path' | 'annotated_image_path'> | null>(null);

  const activeResult = detectResult;

  // Audio playback state
  const [tempo, setTempo] = useState(100);
  const [isBuildingWav, setIsBuildingWav] = useState(false);
  const [wavError, setWavError] = useState<string | null>(null);
  const [highlightStaff, setHighlightStaff] = useState(0);
  const [highlightEvent, setHighlightEvent] = useState(0);

  // Keep latest playback config accessible to useTabPlayback via ref
  const playbackConfigRef = useRef<{
    result: TabDetectionResult;
    tempo: number;
    onTick: (staffIndex: number, eventIndex: number) => void;
    onEnd: () => void;
  } | null>(null);

  if (activeResult) {
    playbackConfigRef.current = {
      result: activeResult,
      tempo,
      onTick: (staffIndex, eventIndex) => {
        setHighlightStaff(staffIndex);
        setHighlightEvent(eventIndex);
      },
      onEnd: () => {
        setHighlightStaff(0);
        setHighlightEvent(0);
      },
    };
  } else {
    playbackConfigRef.current = null;
  }

  const {
    playbackState,
    currentTick,
    totalEvents,
    play,
    pause,
    resume,
    stop,
    seekTo,
  } = useTabPlayback(playbackConfigRef);

  const stats = useMemo(() => computeDetectionStats(activeResult), [activeResult]);
  const queryTabId = searchParams.get('tab_id');

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    if (!queryTabId) return;

    let mounted = true;

    const loadSavedTab = async () => {
      setIsDetecting(true);
      setErrorMessage(null);

      try {
        const saved = await getSavedTab(queryTabId);
        if (!mounted) return;
        setDetectResult(normalizeDetectionResult(saved));
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Không tải được bản tab đã lưu.');
      } finally {
        if (mounted) setIsDetecting(false);
      }
    };

    loadSavedTab();
    return () => { mounted = false; };
  }, [queryTabId]);

  const resetSessionState = () => {
    setErrorMessage(null);
    setSaveStatus(null);
    setDetectResult(null);
    setDetectAssets(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    if (nextFile) {
      resetSessionState();
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete('tab_id');
        return next;
      });
    }
  };

  const handleDetect = async () => {
    if (!file) {
      setErrorMessage('Vui lòng chọn ảnh tablature trước khi detect.');
      return;
    }

    setIsDetecting(true);
    setErrorMessage(null);
    setSaveStatus(null);

    try {
      const detected = await detectTabFromImage(file);
      setDetectResult(normalizeDetectionResult(detected.result));
      setDetectAssets({
        saved_json_path: detected.saved_json_path ?? null,
        uploaded_image_path: detected.uploaded_image_path ?? null,
        annotated_image_path: detected.annotated_image_path ?? null,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nhận diện tablature thất bại.');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSave = async () => {
    if (!activeResult) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSaveStatus(null);

    try {
      const saved = await saveTab(activeResult);
      setSaveStatus(saved.message || `Saved as ${saved.tab_id}`);
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.set('tab_id', saved.tab_id);
        return next;
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể lưu tab đã chỉnh sửa.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStopPlayback = () => {
    stop();
    setHighlightStaff(0);
    setHighlightEvent(0);
  };

  const handleSeekPlayback = (eventIndex: number) => {
    seekTo(eventIndex);
    if (activeResult) {
      let staffIdx = 0;
      let remaining = eventIndex;
      for (let si = 0; si < activeResult.staffs.length; si++) {
        if (remaining < activeResult.staffs[si].events.length) {
          staffIdx = si;
          break;
        }
        remaining -= activeResult.staffs[si].events.length;
      }
      setHighlightStaff(staffIdx);
      setHighlightEvent(remaining);
    }
  };

  const handlePlayPreview = () => {
    if (!activeResult) return;
    if (playbackState === 'paused') {
      resume();
    } else {
      play();
    }
  };

  const handleDownloadWav = async () => {
    if (!activeResult) return;
    setIsBuildingWav(true);
    setWavError(null);
    try {
      const blob = await buildAudioFromTab(activeResult, {
        noteDuration: 0.5,
        silenceBetween: 0.05,
      });
      const url = URL.createObjectURL(blob);
      const tabId = activeResult.metadata?.tab_id || 'tablature';
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${tabId}.wav`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setWavError(error instanceof Error ? error.message : 'Không thể tải file WAV.');
    } finally {
      setIsBuildingWav(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const nextFile = event.dataTransfer.files?.[0] ?? null;
    if (!nextFile) return;
    setFile(nextFile);
    resetSessionState();
  };

  // Convert server file path to browser URL
  const toAssetUrl = (path: string | null) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    const normalized = path.replace(/\\/g, '/');
    const m = normalized.match(/\/(uploads\/.*)$/i) || normalized.match(/\/(outputs\/.*)$/i);
    return m ? `http://localhost:5001/${m[1]}` : null;
  };

  const uploadedImageUrl = toAssetUrl(detectAssets?.uploaded_image_path ?? null);
  const annotatedImageUrl = toAssetUrl(detectAssets?.annotated_image_path ?? null);

  return (
    <main className="tab-workspace-page">
      {/* Zone 1: Header */}
      <div className="tab-workspace-hero">
        <div>
          <p className="tab-kicker">AI Guitar Tablature</p>
          <h1>Nhận diện Tab từ ảnh</h1>
          <p>Tải lên ảnh tablature để AI phân tích và hiển thị kết quả.</p>
        </div>
      </div>

      {errorMessage ? <div className="tab-global-error">{errorMessage}</div> : null}

      {/* Zone 2: Upload & Action Bar */}
      <div className="tab-upload-bar">
        <label
          className={`tab-dropzone${isDragOver ? ' is-dragover' : ''}${file ? ' has-file' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
        >
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <span className="tab-dropzone__icon" aria-hidden="true">♪</span>
          <strong>{file ? file.name : 'Drop tablature image here'}</strong>
          <span>{file ? 'Sẵn sàng để detect.' : 'Kéo thả hoặc click để chọn ảnh PNG/JPG.'}</span>
        </label>

        <div className="tab-upload-bar__actions">
          <AppButton onClick={handleDetect} disabled={!file || isDetecting}>
            {isDetecting ? 'Đang nhận diện...' : 'Nhận diện Tab'}
          </AppButton>
          <AppButton variant="secondary" onClick={handleSave} disabled={!activeResult || isSaving}>
            {isSaving ? 'Đang lưu...' : 'Lưu kết quả'}
          </AppButton>
        </div>

        <div className="tab-upload-bar__status">
          <span className="tab-status-label">AI status</span>
          <span className={`tab-status-pill ${isDetecting ? 'is-busy' : activeResult ? 'is-success' : ''}`}>
            {isDetecting ? 'Processing' : activeResult ? 'Ready' : 'Awaiting'}
          </span>
        </div>
      </div>

      {saveStatus ? <div className="tab-save-note">{saveStatus}</div> : null}

      {/* Zone 3: Results */}
      {activeResult ? (
        <div className="tab-results-layout">
          {/* Left: Images + Stats */}
          <div className="tab-results-left">
            {/* Source images */}
            <div className="tab-images-card">
              <div className="tab-images-card__header">
                <p className="tab-kicker">Source</p>
                <h3>Hình ảnh gốc &amp; đã nhận diện</h3>
              </div>

              <div className="tab-images-grid">
                <div className="tab-image-block">
                  <div className="tab-image-block__heading">
                    <strong>Ảnh gốc</strong>
                    <span>{uploadedImageUrl ? 'Từ server' : 'Preview local'}</span>
                  </div>
                  <div className="tab-image-stage">
                    {uploadedImageUrl || previewUrl ? (
                      <img src={uploadedImageUrl || previewUrl || ''} alt="Ảnh tablature gốc" className="tab-image-stage__img" />
                    ) : (
                      <div className="tab-image-stage__empty">
                        <strong>Chưa có ảnh đầu vào</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="tab-image-block">
                  <div className="tab-image-block__heading">
                    <strong>Ảnh sau detect</strong>
                    <span>{annotatedImageUrl ? 'Annotated' : 'Chưa có'}</span>
                  </div>
                  <div className="tab-image-stage">
                    {annotatedImageUrl ? (
                      <img src={annotatedImageUrl} alt="Ảnh đã ghi chú" className="tab-image-stage__img" />
                    ) : (
                      <div className="tab-image-stage__empty">
                        <strong>Chưa có ảnh detect</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="tab-stats-card">
              <div className="tab-panel-heading">
                <p className="tab-kicker">Stats</p>
                <h3>Thống kê nhận diện</h3>
              </div>
              <div className="tab-summary-grid">
                <div className="tab-stat-card">
                  <span>Staffs</span>
                  <strong>{stats.staff_count}</strong>
                </div>
                <div className="tab-stat-card">
                  <span>Notes</span>
                  <strong>{stats.note_count_after_dedup}</strong>
                </div>
                <div className="tab-stat-card">
                  <span>Events</span>
                  <strong>{stats.event_count_total}</strong>
                </div>
                <div className="tab-stat-card">
                  <span>Uncertain</span>
                  <strong>{stats.uncertain_note_count}</strong>
                </div>
              </div>
            </div>

            {/* Metadata */}
            {activeResult.metadata ? (
              <div className="tab-meta-card">
                <div className="tab-panel-heading">
                  <p className="tab-kicker">Info</p>
                  <h3>Thông tin metadata</h3>
                </div>
                <div className="tab-meta-list">
                  {Object.entries(activeResult.metadata).map(([key, value]) => (
                    <div key={key} className="tab-meta-row">
                      <span>{key}</span>
                      <strong>{String(value ?? '—')}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Right: Tab SVG */}
          <div className="tab-results-right">
            <div className="tab-staff-card">
              <div className="tab-staff-card__header">
                <div>
                  <p className="tab-kicker">Rendered</p>
                  <h3>Tablature từ dữ liệu AI</h3>
                </div>
                <div className="tab-staff-card__actions">
                  <button
                    type="button"
                    className="tab-audio-btn tab-audio-btn--preview"
                    onClick={handlePlayPreview}
                    disabled={totalEvents === 0}
                    title="Phát nhanh bằng Web Audio (nghe tức thì)"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M4 2.5L13 8L4 13.5V2.5Z" fill="currentColor" />
                    </svg>
                    Nghe thử
                  </button>
                  <button
                    type="button"
                    className="tab-audio-btn tab-audio-btn--download"
                    onClick={handleDownloadWav}
                    disabled={isBuildingWav}
                    title="Tổng hợp WAV từ Flask AI server rồi tải về máy"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M8 1.5v9m0 0L4.5 7M8 10.5L11.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M2.5 12.5v1A1.5 1.5 0 0 0 4 15h8a1.5 1.5 0 0 0 1.5-1.5v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {isBuildingWav ? 'Đang tạo WAV...' : 'Tải WAV'}
                  </button>
                </div>
              </div>
              {wavError ? <div className="tab-audio-error">{wavError}</div> : null}
              <TabStaffSVG
                result={activeResult}
                isLoading={false}
                currentTick={currentTick}
                isPlaying={playbackState === 'playing'}
              />
              <TabPlaybackControls
                playbackState={playbackState}
                currentTick={currentTick}
                totalEvents={totalEvents}
                tempo={tempo}
                onPlay={play}
                onPause={pause}
                onResume={resume}
                onStop={handleStopPlayback}
                onTempoChange={setTempo}
                onSeek={handleSeekPlayback}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="tab-empty-state">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="12" y="20" width="40" height="3" rx="1.5" fill="#d4c5a9" />
            <rect x="12" y="27" width="40" height="3" rx="1.5" fill="#d4c5a9" />
            <rect x="12" y="34" width="40" height="3" rx="1.5" fill="#d4c5a9" />
            <rect x="12" y="41" width="40" height="3" rx="1.5" fill="#d4c5a9" />
            <text x="8" y="18" fontSize="9" fill="#b0a090" fontWeight="700" textAnchor="end" fontFamily="sans-serif">e</text>
            <text x="8" y="25" fontSize="9" fill="#b0a090" fontWeight="700" textAnchor="end" fontFamily="sans-serif">B</text>
            <text x="8" y="32" fontSize="9" fill="#b0a090" fontWeight="700" textAnchor="end" fontFamily="sans-serif">G</text>
            <text x="8" y="39" fontSize="9" fill="#b0a090" fontWeight="700" textAnchor="end" fontFamily="sans-serif">D</text>
            <text x="8" y="46" fontSize="9" fill="#b0a090" fontWeight="700" textAnchor="end" fontFamily="sans-serif">A</text>
          </svg>
          <strong>Chưa có kết quả nhận diện</strong>
          <span>Tải ảnh tablature và nhấn "Nhận diện Tab" để bắt đầu.</span>
        </div>
      )}

      {isDetecting && !activeResult ? (
        <div className="tab-loading-state">
          <div className="tab-loading-spinner" />
          <span>AI đang phân tích hình ảnh...</span>
        </div>
      ) : null}
    </main>
  );
}
