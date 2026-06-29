import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../features/admin/admin.service';
import type { AdminStats } from '../../features/admin/admin.service';

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  teacher: 'Giảng viên',
  student: 'Học viên',
};

const levelLabel: Record<string, string> = {
  beginner: 'Sơ cấp',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao',
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminService.getStats();
        if (mounted) setStats(data);
      } catch {
        if (mounted) setError('Không thể tải dữ liệu thống kê.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="auth-loader" aria-hidden="true" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="admin-page-header">
        <h1>Tổng quan</h1>
        <p className="auth-error">{error || 'Không có dữ liệu.'}</p>
      </div>
    );
  }

  const { overview } = stats;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Tổng quan</h1>
        <p>Tình hình hoạt động của ứng dụng GuitarVN</p>
      </div>

      {/* User Stats */}
      <h3 className="admin-section-title">Người dùng</h3>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <p className="stat-label">Tổng người dùng</p>
          <p className="stat-value">{overview.users.total}</p>
          <p className="stat-sub">{overview.users.newLast7Days} tuần này · {overview.users.newLast30Days} tháng này</p>
        </div>
        <div className="admin-stat-card">
          <p className="stat-label">Học viên</p>
          <p className="stat-value">{overview.users.students}</p>
          <p className="stat-sub">Khóa học &amp; Quiz</p>
        </div>
        <div className="admin-stat-card">
          <p className="stat-label">Giảng viên</p>
          <p className="stat-value">{overview.users.teachers}</p>
          <p className="stat-sub">Tạo nội dung</p>
        </div>
        <div className="admin-stat-card">
          <p className="stat-label">Quản trị viên</p>
          <p className="stat-value">{overview.users.admins}</p>
          <p className="stat-sub">Toàn quyền hệ thống</p>
        </div>
      </div>

      {/* Content Stats */}
      <h3 className="admin-section-title">Nội dung</h3>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <p className="stat-label">Khóa học</p>
          <p className="stat-value">{overview.content.totalCourses}</p>
          <p className="stat-sub">{overview.content.publishedCourses} đã xuất bản · {overview.content.unpublishedCourses} ẩn</p>
        </div>
        <div className="admin-stat-card">
          <p className="stat-label">Bài hát</p>
          <p className="stat-value">{overview.content.totalSongs}</p>
          <p className="stat-sub">Thư viện Tab nhạc</p>
        </div>
        <div className="admin-stat-card">
          <p className="stat-label">Quiz</p>
          <p className="stat-value">{overview.content.totalQuizzes}</p>
          <p className="stat-sub">Bài kiểm tra</p>
        </div>
        <div className="admin-stat-card">
          <p className="stat-label">Lượt đăng ký</p>
          <p className="stat-value">{overview.engagement.totalEnrollments}</p>
          <p className="stat-sub">Tổng lượt ghi danh</p>
        </div>
      </div>

      {/* Engagement */}
      <h3 className="admin-section-title">Tương tác</h3>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <p className="stat-label">Bản ghi tiến độ</p>
          <p className="stat-value">{overview.engagement.totalProgressRecords}</p>
        </div>
        <div className="admin-stat-card">
          <p className="stat-label">Huy hiệu đã trao</p>
          <p className="stat-value">{overview.engagement.totalBadgeUnlocks}</p>
          <p className="stat-sub">trên {overview.engagement.totalBadges} loại</p>
        </div>
        <div className="admin-stat-card">
          <p className="stat-label">Hoạt động 7 ngày</p>
          <p className="stat-value">{overview.engagement.activitiesLast7Days}</p>
        </div>
      </div>

      {/* Two columns */}
      <div className="admin-two-col">
        {/* Top Users */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="admin-section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>Học viên nổi bật</h3>
          </div>
          {stats.topUsers.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: 13 }}>Chưa có dữ liệu.</p>
          ) : (
            stats.topUsers.map((u) => (
              <div key={u.id} className="admin-list-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="admin-user-avatar">🎸</div>
                  <div className="admin-list-item-info">
                    <strong>{u.name}</strong>
                    <small>{u.email}</small>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`admin-badge admin-badge-${u.role}`}>{roleLabel[u.role] || u.role}</span>
                  <br />
                  <small style={{ color: '#9ca3af', fontSize: 11 }}>🔥 {u.currentStreakDays} ngày</small>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Popular Courses */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="admin-section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>Khóa học phổ biến</h3>
            <Link to="/quan-tri/khoa-hoc" style={{ fontSize: 12, color: '#2563eb' }}>Xem tất cả →</Link>
          </div>
          {stats.popularCourses.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: 13 }}>Chưa có dữ liệu.</p>
          ) : (
            stats.popularCourses.map((c) => (
              <div key={c.id} className="admin-list-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="admin-user-avatar">📚</div>
                  <div className="admin-list-item-info">
                    <strong>{c.title}</strong>
                    <small>{levelLabel[c.level] || c.level}</small>
                  </div>
                </div>
                <span style={{ color: '#6b7280', fontSize: 12 }}>
                  {c.enrollmentCount} đăng ký
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="admin-two-col" style={{ marginTop: 24 }}>
        {/* Recent Users */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="admin-section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>Người dùng mới</h3>
            <Link to="/quan-tri/nguoi-dung" style={{ fontSize: 12, color: '#2563eb' }}>Xem tất cả →</Link>
          </div>
          {stats.recentUsers.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: 13 }}>Chưa có người dùng.</p>
          ) : (
            stats.recentUsers.map((u) => (
              <div key={u.id} className="admin-list-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="admin-user-avatar">👤</div>
                  <div className="admin-list-item-info">
                    <strong>{u.name}</strong>
                    <small>{u.email}</small>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`admin-badge admin-badge-${u.role}`}>{roleLabel[u.role] || u.role}</span>
                  <br />
                  <small style={{ color: '#9ca3af', fontSize: 11 }}>
                    {u.isActive ? '✓ Hoạt động' : '✗ Bị khóa'}
                  </small>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent Enrollments */}
        <div className="admin-card">
          <h3 className="admin-section-title" style={{ marginBottom: 16 }}>Đăng ký gần đây</h3>
          {stats.recentEnrollments.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: 13 }}>Chưa có lượt đăng ký.</p>
          ) : (
            stats.recentEnrollments.map((e) => (
              <div key={e.id} className="admin-enrollment-item">
                <div className="admin-user-avatar">📖</div>
                <div>
                  <strong>{e.user?.name || 'N/A'}</strong>
                  <p>đã đăng ký <em>{e.course?.title || 'N/A'}</em></p>
                </div>
                <small style={{ color: '#9ca3af', fontSize: 11, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                  {new Date(e.enrolledAt).toLocaleDateString('vi-VN')}
                </small>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
