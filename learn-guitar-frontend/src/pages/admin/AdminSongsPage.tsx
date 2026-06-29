import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import songService from '../../features/song/song.service';
import type { SongListItem } from '../../features/song/song.types';

export default function AdminSongsPage() {
  const [songs, setSongs] = useState<SongListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchSongs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await songService.getSongs({ page, limit: 20 });
      setSongs(data.songs);
      setTotalPages(data.pagination?.pages ?? 1);
      setTotal(data.pagination?.total ?? 0);
    } catch {
      setError('Không thể tải danh sách bài hát.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchSongs(); }, [fetchSongs]);

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Quản lý bài hát</h1>
          <p>Tổng cộng {total} bài hát</p>
        </div>
        <Link to="/songs/new" className="app-btn app-btn-primary">
          + Thêm bài hát mới
        </Link>
      </div>

      {loading ? (
        <div className="admin-loading"><div className="auth-loader" aria-hidden="true" /></div>
      ) : error ? (
        <p className="auth-error">{error}</p>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Bài hát</th>
                <th>Ca sĩ</th>
                <th>Thể loại</th>
                <th>Độ khó</th>
                <th>Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              {songs.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#6b7280', padding: '32px 0' }}>Chưa có bài hát nào.</td></tr>
              ) : (
                songs.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="admin-user-avatar">🎵</div>
                        <div>
                          <strong>{s.title}</strong>
                          <br />
                          <small style={{ color: '#6b7280', fontSize: 11 }}>{s.slug}</small>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#6b7280', fontSize: 13 }}>{s.artist || '—'}</td>
                    <td style={{ color: '#6b7280', fontSize: 13 }}>{s.genre || '—'}</td>
                    <td>
                      <span className={`admin-badge admin-badge-${
                        s.difficulty === 'beginner' ? 'student' :
                        s.difficulty === 'intermediate' ? 'teacher' : 'admin'
                      }`}>
                        {s.difficulty === 'beginner' ? 'Dễ' :
                         s.difficulty === 'intermediate' ? 'Trung bình' :
                         s.difficulty === 'advanced' ? 'Khó' : '—'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <Link
                          to={`/songs/${s.slug}`}
                          className="admin-btn-sm admin-btn-sm-primary"
                          style={{ textDecoration: 'none' }}
                          target="_blank"
                        >
                          Xem
                        </Link>
                        <Link
                          to={`/songs/${s.slug}/edit`}
                          className="admin-btn-sm"
                          style={{ textDecoration: 'none' }}
                        >
                          Sửa
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="admin-pagination">
            <span>Trang {page} / {totalPages} · {total} kết quả</span>
            <div className="admin-pagination-btns">
              <button onClick={() => setPage(1)} disabled={page <= 1}>«</button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>‹</button>
              <span style={{ padding: '6px 12px' }}>{page}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>›</button>
              <button onClick={() => setPage(totalPages)} disabled={page >= totalPages}>»</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
