import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './AdminLayout.css';

const adminMenu = [
  {
    section: 'Tổng quan',
    items: [
      { to: '/quan-tri', label: 'Dashboard', icon: '📊', exact: true as const },
    ],
  },
  {
    section: 'Quản lý',
    items: [
      { to: '/quan-tri/nguoi-dung', label: 'Người dùng', icon: '👥', exact: false as const },
      { to: '/quan-tri/khoa-hoc', label: 'Khóa học', icon: '📚', exact: false as const },
      { to: '/quan-tri/bai-hat', label: 'Bài hát', icon: '🎵', exact: false as const },
      { to: '/quan-tri/quizzes', label: 'Quizzes', icon: '🧩', exact: false as const },
    ],
  },
  {
    section: 'Nội dung',
    items: [
      { to: '/quan-tri/studio', label: 'Tạo nội dung', icon: '✏️', exact: false as const },
    ],
  },
];

export default function AdminLayout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isAdmin) {
    return (
      <div className="admin-access-denied">
        <h2>Bạn không có quyền truy cập trang quản trị</h2>
        <p>Trang này chỉ dành cho quản trị viên.</p>
        <button className="app-btn app-btn-primary" onClick={() => navigate('/dashboard')}>
          Quay về Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span className="admin-logo">♪</span>
          <div>
            <strong>GuitarVN Admin</strong>
            <small>{user?.name}</small>
          </div>
        </div>

        <nav className="admin-nav">
          {adminMenu.map((section) => (
            <div key={section.section} className="admin-nav-section">
              <p className="admin-nav-section-title">{section.section}</p>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    `admin-nav-item ${isActive ? 'admin-nav-item-active' : ''}`
                  }
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <NavLink to="/dashboard" className="admin-nav-item">
            <span aria-hidden="true">🏠</span>
            Về trang chủ
          </NavLink>
          <button className="admin-nav-item admin-logout-btn" onClick={handleLogout}>
            <span aria-hidden="true">🚪</span>
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
