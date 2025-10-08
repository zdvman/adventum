// src/components/auth/RequireAuth.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import Loading from '@/components/ui/Loading';

export default function RequireAuth({ children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <Loading />;

  if (!user) {
    return (
      <Navigate
        to='/auth/sign-in'
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }
  return children;
}
