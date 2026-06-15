import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Trang chủ', icon: '🏠' },
  { to: '/khoa-hoc', label: 'Khóa học', icon: '🎸' },
  { to: '/khoa-hoc-cua-toi', label: 'Của tôi', icon: '📚' },
  { to: '/nhac-ly', label: 'Nhạc lý', icon: '📘' },
  { to: '/quiz-lessons', label: 'Quiz', icon: '🧩' },
  { to: '/hop-am', label: 'Hợp âm', icon: '🎼' },
  { to: '/nhan-dien-tab', label: 'Tab ảnh', icon: '📷' },
  { to: '/thuc-hanh', label: 'Thực hành', icon: '⏱' },
  { to: '/dashboard', label: 'Tôi', icon: '⭐' },
];

export default function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-nav" aria-label="Điều hướng trên điện thoại">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? 'mobile-bottom-nav-item-active' : ''}`.trim()}
        >
          <span aria-hidden="true">{item.icon}</span>
          <small>{item.label}</small>
        </NavLink>
      ))}
    </nav>
  );
}
