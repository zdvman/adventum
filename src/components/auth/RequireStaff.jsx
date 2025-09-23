import { useAuth } from '@/contexts/useAuth';

// src/components/auth/RequireStaff.jsx
export default function RequireStaff({ children }) {
  const { profile } = useAuth();
  if (profile?.role !== 'staff') return null; // or a 403 component
  return children;
}
