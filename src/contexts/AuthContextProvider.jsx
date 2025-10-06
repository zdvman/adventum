import { useEffect, useMemo, useState } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { clearSession, loadSession, saveSession } from '@/utils/storage';

import { auth, db } from '@/services/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null); // { uid, email }
  const [profile, setProfile] = useState(null); // { name, role, avatar }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Pre-hydrate from our own storage (faster first paint)
    const stored = loadSession();
    if (stored?.user && stored?.profile) {
      setUser(stored.user);
      setProfile(stored.profile);
      setLoading(false);
    }

    // Source of truth: Firebase Auth state
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (!fbUser) {
          clearSession();
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        const base = { uid: fbUser.uid, email: fbUser.email ?? null };

        // Ensure a profile doc exists
        const ref = doc(db, 'profiles', fbUser.uid);
        let snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            name: '',
            role: 'member',
            avatar: '/avatars/incognito.png',
          });
          snap = await getDoc(ref);
        }
        const p = snap.data() ?? {
          name: '',
          role: 'member',
          avatar: '/avatars/incognito.png',
        };

        setUser(base);
        setProfile(p);

        // Persist to localStorage OR sessionStorage based on previous choice (default to “remember”)
        const prev = loadSession();
        const remember = prev?._source ? prev._source === 'local' : true;
        saveSession({ user: base, profile: p, ts: Date.now() }, remember);
      } catch (e) {
        console.error('Auth state error:', e);
        setError(e.message || 'Authentication error');
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  // Email/password sign-in
  async function signIn(email, password, { remember = false } = {}) {
    setLoading(true);
    setError(null);
    try {
      if (!email || !password)
        throw new Error('Email and password are required.');
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );
      await signInWithEmailAndPassword(auth, email, password);
      return true; // onAuthStateChanged will complete state
    } catch (err) {
      console.error('Sign-in error:', err);
      setError(err.message || 'Failed to sign in');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  // Email/password sign-up + create profile doc
  async function signUp(
    {
      name,
      email,
      password,
      role = 'member',
      avatar = '/avatars/incognito.png',
    },
    { remember = false } = {}
  ) {
    setLoading(true);
    setError(null);
    try {
      if (!name || !email || !password)
        throw new Error('All fields are required.');
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const ref = doc(db, 'profiles', cred.user.uid);
      await setDoc(ref, { name, role, avatar });
      return { uid: cred.user.uid, email: cred.user.email };
    } catch (err) {
      console.error('Sign-up error:', err);
      setError(err.message || 'Failed to sign up');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  // Google sign-in (POPUP ONLY, no redirect)
  async function signInWithGoogle({ remember = false } = {}) {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    setError(null);
    try {
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );
      const result = await signInWithPopup(auth, provider);
      return result.user; // onAuthStateChanged will also run
    } catch (err) {
      // If user closes the popup, nothing else happens (no redirect).
      console.error('Google sign-in error:', err);
      setError(err.message || 'Failed to sign in with Google');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(email) {
    if (!email) throw new Error('Email is required.');
    try {
      setLoading(true);
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      console.error('Reset error:', err);
      setError(err.message || 'Failed to send reset email');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    try {
      await fbSignOut(auth);
    } finally {
      clearSession();
      setUser(null);
      setProfile(null);
    }
  }

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      signInWithGoogle,
      error,
      setError,
    }),
    [user, profile, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
