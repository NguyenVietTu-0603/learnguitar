import AppCard from '../common/AppCard';

interface ImagePreviewPanelProps {
  previewUrl: string | null;
  isDetecting: boolean;
  uploadedImagePath: string | null;
  annotatedImagePath: string | null;
  savedJsonPath: string | null;
}

function toBrowserAssetUrl(path: string | null) {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.replace(/\\/g, '/');
  const uploadsMatch = normalizedPath.match(/\/(uploads\/.*)$/i);
  if (uploadsMatch) {
    return `http://localhost:5001/${uploadsMatch[1]}`;
  }

  const outputsMatch = normalizedPath.match(/\/(outputs\/.*)$/i);
  if (outputsMatch) {
    return `http://localhost:5001/${outputsMatch[1]}`;
  }

  return null;
}

export default function ImagePreviewPanel({
  previewUrl,
  isDetecting,
  uploadedImagePath,
  annotatedImagePath,
  savedJsonPath,
}: ImagePreviewPanelProps) {
  const uploadedImageUrl = toBrowserAssetUrl(uploadedImagePath);
  const annotatedImageUrl = toBrowserAssetUrl(annotatedImagePath);

  return (
    <AppCard className="tab-shell-card tab-shell-card--image">
      <div className="tab-panel-heading tab-panel-heading--row">
        <div>
          <p className="tab-kicker">Source image</p>
          <h3>Original & detected tablature</h3>
        </div>
        {isDetecting ? <span className="tab-status-pill is-busy">Scanning</span> : null}
      </div>

      <div className="tab-image-gallery">
        <div className="tab-image-block">
          <div className="tab-image-block__heading">
            <strong>Ảnh gốc</strong>
            <span>{uploadedImageUrl ? 'Từ AI server' : 'Preview local'}</span>
          </div>
          <div className="tab-image-stage">
            {uploadedImageUrl || previewUrl ? (
              <img src={uploadedImageUrl || previewUrl || ''} alt="Uploaded guitar tablature" className="tab-image-stage__img" />
            ) : (
              <div className="tab-image-stage__empty">
                <strong>Chưa có ảnh đầu vào</strong>
                <span>Ảnh gốc sẽ hiển thị tại đây để đối chiếu với dữ liệu AI.</span>
              </div>
            )}
          </div>
        </div>

        <div className="tab-image-block">
          <div className="tab-image-block__heading">
            <strong>Ảnh sau detect</strong>
            <span>{annotatedImageUrl ? 'Annotated output' : 'Chưa có file annotate'}</span>
          </div>
          <div className="tab-image-stage">
            {annotatedImageUrl ? (
              <img src={annotatedImageUrl} alt="Detected tablature annotations" className="tab-image-stage__img" />
            ) : (
              <div className="tab-image-stage__empty">
                <strong>Chưa có ảnh detect</strong>
                <span>Backend hiện chưa trả `annotated_image_path` nên panel này đang chờ output ảnh annotate.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {savedJsonPath ? <p className="tab-inline-note">JSON saved: {savedJsonPath}</p> : null}
    </AppCard>
  );
}
