import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

interface ProtectedRouteProps {
  allowedRoles?: ('admin' | 'teacher' | 'student')[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isCheckingAuth, isAdmin, isTeacher } = useAuth();

  if (isCheckingAuth) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loader" aria-hidden="true"></div>
        <p>Đang kiểm tra phiên đăng nhập...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = allowedRoles.some((role) => {
      if (role === 'admin') return isAdmin;
      if (role === 'teacher') return isTeacher;
      return true;
    });

    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}
