import { Link } from 'react-router-dom';
import type { Chord } from '../../features/chord/chord.types';
import type { SongDetail } from '../../features/song/song.types';

interface SongDetailSidebarProps {
  song: SongDetail;
  chords: Chord[];
  isAuthenticated: boolean;
  isDeleting: boolean;
  onDelete: () => void;
  onPickChord: (chord: Chord) => void;
}

export default function SongDetailSidebar({
  song,
  chords,
  isAuthenticated,
  isDeleting,
  onDelete,
  onPickChord,
}: SongDetailSidebarProps) {
  return (
    <aside className="song-detail-sidebar">
      {song.youtubeLink && (
        <div className="song-sidebar-card">
          <h3>Video</h3>
          <div className="song-sidebar-video">
            <iframe
              src={`https://www.youtube.com/embed/${song.youtubeLink}`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      <div className="song-sidebar-card">
        <div className="song-detail-actions">
          <Link to="/songs" className="ghost-btn">Danh sách</Link>
          {isAuthenticated ? (
            <Link to={`/songs/${song.slug}/edit`} className="ghost-btn">Chỉnh sửa</Link>
          ) : null}
          {isAuthenticated ? (
            <button type="button" className="danger-btn" onClick={onDelete} disabled={isDeleting}>
              {isDeleting ? 'Đang xóa...' : 'Xóa bài hát'}
            </button>
          ) : null}
        </div>
      </div>

      <div className="song-sidebar-card">
        <h3>Thông tin</h3>
        <div className="song-detail-meta-grid">
          <div className="song-detail-meta-item">
            <span>Capo</span>
            <strong>{song.capo}</strong>
          </div>
          <div className="song-detail-meta-item">
            <span>Tempo</span>
            <strong>{song.tempo ?? '-'}</strong>
          </div>
          <div className="song-detail-meta-item">
            <span>Nhịp</span>
            <strong>{song.timeSignature}</strong>
          </div>
          <div className="song-detail-meta-item">
            <span>Lượt xem</span>
            <strong>{song.views}</strong>
          </div>
        </div>
      </div>

      {song.strummingPattern ? (
        <div className="song-sidebar-card">
          <h3>Mẫu Strumming</h3>
          <p className="song-strumming-value">{song.strummingPattern}</p>
        </div>
      ) : null}

      <div className="song-sidebar-card">
        <h3>Hợp âm</h3>
        {chords.length === 0 ? (
          <p className="song-no-chords">Chưa tìm thấy hợp âm trong bài này.</p>
        ) : (
          <div className="song-chords-legend">
            {chords.map((chord) => (
              <button
                key={chord.id}
                type="button"
                className="chord-pill"
                onClick={() => onPickChord(chord)}
              >
                {chord.displayName || chord.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
