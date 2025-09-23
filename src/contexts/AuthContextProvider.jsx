// src/context/AuthContext.jsx
import { useState } from 'react';

export function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null); // { uid, email }
  const [profile, setProfile] = useState(null); // { role: 'member'|'staff', name }
  const [loading, setLoading] = useState(false);

  // replace these with Firebase/Supabase later
  async function signIn(email, password = null) {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const mock = { uid: 'u1', email };
    setUser(mock);
    setProfile({
      role: email.includes('+staff') ? 'staff' : 'member',
      name: 'Demo User',
    });
    setLoading(false);
  }
  async function signOut() {
    setUser(null);
    setProfile(null);
  }

  const value = { user, profile, loading, signIn, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
