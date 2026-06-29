import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

const menuItems = [
  { to: '/', label: 'Trang chủ' },
  { to: '/khoa-hoc', label: 'Khóa học' },
  { to: '/khoa-hoc-cua-toi', label: 'Khóa học của tôi' },
  { to: '/video-lessons', label: 'Bài học Video' },
  { to: '/quiz', label: 'Quiz' },
  { to: '/hop-am', label: 'Hợp âm' },
  { to: '/tab-nhac', label: 'Tab Nhạc' },
  { to: '/nhan-dien-tab', label: 'Nhận diện tab' },
  { to: '/thuc-hanh', label: 'Thực hành' },
  { to: '/dashboard', label: 'Bảng điều khiển' },
];


export default function TopNavbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="top-navbar" id="top">
      <div className=" top-navbar-inner">
        <NavLink to="/" className="brand">
          <span className="brand-mark">♪</span>
          <div>
            <strong>GuitarVN</strong>
            <small>Học guitar cùng cảm hứng Việt</small>
          </div>
        </NavLink>

        <nav className="top-menu" aria-label="Điều hướng chính">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `top-menu-link ${isActive ? 'top-menu-link-active' : ''}`.trim()}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="top-navbar-actions">
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <NavLink
                  to="/quan-tri"
                  className={({ isActive }) => `top-menu-link ${isActive ? 'top-menu-link-active' : ''}`.trim()}
                  style={{ color: '#7c83fd', fontWeight: 600 }}
                >
                  Quản trị
                </NavLink>
              )}
              <span className="top-navbar-user">Xin chào, {user?.name ?? user?.email}</span>
              <button type="button" className="app-btn app-btn-ghost" onClick={handleLogout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="app-btn app-btn-ghost">
                Đăng nhập
              </NavLink>
              <NavLink to="/register" className="app-btn app-btn-primary">
                Bắt đầu học
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
