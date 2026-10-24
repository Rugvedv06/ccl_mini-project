import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

export default function RoleRoute({ role, children }) {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <Spinner />;
  if (status !== 'authenticated') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user?.role !== role) return <Navigate to="/unauthorized" replace />;
  return children;
}
