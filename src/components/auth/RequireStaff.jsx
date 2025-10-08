// src/components/auth/RequireStaff.jsx
import { useAuth } from '@/contexts/useAuth';
import Loading from '@/components/ui/Loading';

export default function RequireStaff({ children }) {
  const { profile, initializing } = useAuth();

  if (initializing) return <Loading />; // wait for profile to load
  if (profile?.role !== 'staff') return null; // or render a 403 component
  return children;
}
