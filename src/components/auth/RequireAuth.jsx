// src/components/auth/RequireAuth.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import Loading from '@/components/ui/Loading';

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <Loading />; // or spinner
  if (!user)
    return <Navigate to='/auth/sign-in' replace state={{ from: pathname }} />;
  return children;
}
