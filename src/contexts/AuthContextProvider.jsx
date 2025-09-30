// src/context/AuthContext.jsx
import { useEffect, useMemo, useState } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { clearSession, loadSession, saveSession } from '@/utils/storage';
import { Avatar } from '@/components/catalyst-ui-kit/avatar';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null); // { uid, email }
  const [profile, setProfile] = useState(null); // { role: 'member'|'staff', name }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const stored = loadSession();
    if (stored?.user && stored?.profile) {
      setUser(stored.user);
      setProfile(stored.profile);
    }
    setLoading(false);
  }, []);

  // replace these with Firebase/Supabase later
  async function signIn(email, password, { remember = false } = {}) {
    setLoading(true);
    setError(null);
    try {
      if (!email || !password)
        throw new Error('Email and password are required.');
      const res = await fetch(
        `${API_BASE}/users?email=${encodeURIComponent(email)}`
      );
      if (!res.ok) throw new Error('Failed to connect to server');
      const users = await res.json();
      const foundUser = users[0];
      if (!foundUser) throw new Error('User not found');
      if (foundUser.password !== password) throw new Error('Invalid password');

      const safeUser = { uid: String(foundUser.id), email: foundUser.email };
      const safeProfile = {
        name: foundUser.name,
        role: foundUser.role,
        avatar: foundUser.avatar || '/avatars/incognito.png',
      };
      setUser(safeUser);
      setProfile(safeProfile);
      saveSession(
        { user: safeUser, profile: safeProfile, ts: Date.now() },
        remember
      );
      return { user: safeUser, profile: safeProfile };
    } catch (err) {
      console.error('Sign-in error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function signUp(
    { name, email, password, role = 'member', avatar = '' },
    { remember = false } = {}
  ) {
    setLoading(true);
    setError(null);
    try {
      if (!email || !password || !name)
        throw new Error('All fields are required.');
      // Prevent duplicates
      const check = await fetch(
        `${API_BASE}/users?email=${encodeURIComponent(email)}`
      );
      const existing = await check.json();
      if (existing.length) throw new Error('Email already exists');

      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, avatar }),
      });
      if (!res.ok) throw new Error('Failed to register user');

      const created = await res.json();

      const safeUser = { uid: String(created.id), email: created.email };
      const safeProfile = {
        name: created.name,
        role: created.role === 'staff' ? 'staff' : 'member',
        avatar: created.avatar || '/avatars/incognito.png',
      };

      setUser(safeUser);
      setProfile(safeProfile);
      saveSession(
        { user: safeUser, profile: safeProfile, ts: Date.now() },
        remember
      );
      return { user: safeUser, profile: safeProfile };
    } catch (err) {
      console.error('Sign-up error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    clearSession();
    setUser(null);
    setProfile(null);
  }

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      error,
      setError,
    }),
    [user, profile, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
