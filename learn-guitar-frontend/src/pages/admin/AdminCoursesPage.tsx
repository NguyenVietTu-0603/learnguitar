import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import courseService from '../../features/course/course.service';
import type { CourseListItem } from '../../features/course/course.types';

const levelLabel: Record<string, string> = {
  beginner: 'Sơ cấp',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao',
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await courseService.getCourses({ page, limit: 20 });
      setCourses(data.courses);
      setTotalPages(data.pagination?.pages ?? 1);
      setTotal(data.pagination?.total ?? 0);
    } catch {
      setError('Không thể tải danh sách khóa học.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Quản lý khóa học</h1>
          <p>Tổng cộng {total} khóa học</p>
        </div>
        <Link to="/quan-tri/studio" className="app-btn app-btn-primary">
          + Tạo khóa học mới
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
                <th>Khóa học</th>
                <th>Cấp độ</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#6b7280', padding: '32px 0' }}>Chưa có khóa học nào.</td></tr>
              ) : (
                courses.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="admin-user-avatar">📚</div>
                        <div>
                          <strong>{c.title}</strong>
                          <br />
                          <small style={{ color: '#6b7280', fontSize: 11 }}>{c.slug}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge-${
                        c.level === 'beginner' ? 'student' :
                        c.level === 'intermediate' ? 'teacher' : 'admin'
                      }`}>
                        {levelLabel[c.level] || c.level}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge-${c.isPublished ? 'active' : 'inactive'}`}>
                        {c.isPublished ? 'Xuất bản' : 'Ẩn'}
                      </span>
                    </td>
                    <td style={{ color: '#6b7280', fontSize: 12 }}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td>
                      <div className="admin-actions">
                        <Link
                          to={`/khoa-hoc/${c.slug}`}
                          className="admin-btn-sm admin-btn-sm-primary"
                          style={{ textDecoration: 'none' }}
                          target="_blank"
                        >
                          Xem
                        </Link>
                        <Link
                          to="/quan-tri/studio"
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
