// src/components/auth/RequireAuth.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import Loading from '@/components/ui/Loading';

export default function RequireAuth({ children }) {
  const { user, initializing } = useAuth(); // ⬅️ use initializing
  const { pathname } = useLocation();

  if (initializing) return <Loading />; // only while Firebase boots

  if (!user) {
    return <Navigate to='/auth/sign-in' replace state={{ from: pathname }} />;
  }
  return children;
}
