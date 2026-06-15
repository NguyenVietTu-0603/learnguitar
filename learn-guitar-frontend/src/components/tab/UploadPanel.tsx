import type { ChangeEvent } from 'react';
import AppCard from '../common/AppCard';
import AppButton from '../common/AppButton';
import type { TabMetadata } from '../../features/tab/tab.types';

interface UploadPanelProps {
  file: File | null;
  isDragOver: boolean;
  isDetecting: boolean;
  isSaving: boolean;
  hasResult: boolean;
  saveStatus: string | null;
  metadata: TabMetadata | null;
  onFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: React.DragEvent<HTMLLabelElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLLabelElement>) => void;
  onDragLeave: (event: React.DragEvent<HTMLLabelElement>) => void;
  onDetect: () => void;
  onRedetect: () => void;
  onSave: () => void;
}

const metadataEntries = [
  { key: 'title', label: 'Title' },
  { key: 'tab_id', label: 'Tab ID' },
  { key: 'model', label: 'Model' },
  { key: 'source_filename', label: 'Source' },
  { key: 'processing_ms', label: 'AI latency' },
] as const;

export default function UploadPanel({
  file,
  isDragOver,
  isDetecting,
  isSaving,
  hasResult,
  saveStatus,
  metadata,
  onFileInputChange,
  onDrop,
  onDragOver,
  onDragLeave,
  onDetect,
  onRedetect,
  onSave,
}: UploadPanelProps) {
  return (
    <div>
      <AppCard className="tab-shell-card tab-shell-card--sticky">
        <div className="tab-panel-heading">
          <p className="tab-kicker">Input</p>
          <h2>Tab Capture</h2>
          <p>Upload ảnh tablature và đưa vào AI workflow mới.</p>
        </div>

        <label
          className={`tab-dropzone${isDragOver ? ' is-dragover' : ''}${file ? ' has-file' : ''}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          <input type="file" accept="image/*" onChange={onFileInputChange} />
          <span className="tab-dropzone__icon" aria-hidden="true">♪</span>
          <strong>{file ? file.name : 'Drop tablature image here'}</strong>
          <span>{file ? 'Sẵn sàng để detect hoặc chạy lại AI.' : 'Kéo thả hoặc click để chọn ảnh PNG/JPG.'}</span>
        </label>

        <div className="tab-toolbar-actions">
          <AppButton onClick={hasResult ? onRedetect : onDetect} disabled={!file || isDetecting}>
            {isDetecting ? 'Detecting...' : hasResult ? 'Run again' : 'Run detection'}
          </AppButton>
          <AppButton variant="secondary" onClick={onSave} disabled={!hasResult || isSaving}>
            {isSaving ? 'Saving...' : 'Save tab'}
          </AppButton>
        </div>

        <div className="tab-status-card">
          <div>
            <span className="tab-status-card__label">AI status</span>
            <strong>{isDetecting ? 'Processing image' : hasResult ? 'Detection ready' : 'Awaiting upload'}</strong>
          </div>
          <span className={`tab-status-pill ${isDetecting ? 'is-busy' : hasResult ? 'is-success' : ''}`}>
            {isDetecting ? 'Live' : hasResult ? 'Ready' : 'Idle'}
          </span>
        </div>

        {saveStatus ? <p className="tab-inline-note">{saveStatus}</p> : null}
      </AppCard>

      <AppCard className="tab-shell-card">
        <div className="tab-panel-heading">
          <p className="tab-kicker">Metadata</p>
          <h3>Detection context</h3>
        </div>

        <div className="tab-meta-list">
          {metadataEntries.map(({ key, label }) => {
            const value = metadata?.[key];
            const formatted = value === null || value === undefined || value === ''
              ? '—'
              : key === 'processing_ms'
                ? `${value} ms`
                : String(value);

            return (
              <div key={key} className="tab-meta-row">
                <span>{label}</span>
                <strong>{formatted}</strong>
              </div>
            );
          })}
        </div>
      </AppCard>
    </div>
  );
}
