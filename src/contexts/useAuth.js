import { useContext } from 'react';
import { authContext } from '@/contexts/authContext';

export function useAuth() {
  const context = useContext(authContext);
  if (context === undefined)
    throw new Error('useAuth must be used within an AuthContextProvider');
  return context;
}
