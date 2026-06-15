import type { PropsWithChildren } from 'react';
import { useLocation } from 'react-router-dom';
import TopNavbar from '../components/navigation/TopNavbar';
import MobileBottomNav from '../components/navigation/MobileBottomNav';

const hideNavigationPaths = ['/login', '/register'];

export default function MainLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  const shouldHideNav = hideNavigationPaths.includes(location.pathname);

  if (shouldHideNav) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      <TopNavbar />
      <div className="page-slot">{children}</div>
      <MobileBottomNav />
    </div>
  );
}
