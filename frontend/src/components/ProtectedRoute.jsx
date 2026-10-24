import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

/**
 * Frontend-only routing guard. The backend independently enforces
 * authentication, role and ownership on every request - this only improves UX.
 */
export default function ProtectedRoute({ children, role }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Checking your session…" />
      </div>
    );
  }
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (role && user?.role !== role) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}
