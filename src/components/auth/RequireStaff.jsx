// src/components/auth/RequireStaff.jsx
import { useAuth } from '@/contexts/useAuth';
import Loading from '@/components/ui/Loading';
import NotFound from '@/pages/NotFound';

export default function RequireStaff({ children }) {
  const { profile, initializing } = useAuth();
  if (initializing) return <Loading />;
  if (profile?.role === 'staff') return children;
  return (
    <NotFound
      message='You do not have permission to view this page.'
      error='403'
      header='Forbidden'
    />
  );
}
