import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error('useAuth must be used within an AuthContextProvider');
  return context;
}
