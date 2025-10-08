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

function buildFullName(firstName, lastName) {
  const parts = [firstName || '', lastName || '']
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.join(' ');
}

export function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null); // { uid, email }
  const [profile, setProfile] = useState(null); // { firstName, lastName, username, role, avatar, fullName }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Pre-hydrate (faster first paint)
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

        const baseUser = { uid: fbUser.uid, email: fbUser.email ?? null };

        // Ensure a profile doc exists with the NEW schema
        const ref = doc(db, 'profiles', fbUser.uid);
        let snap = await getDoc(ref);

        if (!snap.exists()) {
          await setDoc(ref, {
            firstName: '',
            lastName: '',
            username: fbUser.email ?? '',
            role: 'member',
            avatar: '/avatars/incognito.png',
            createdAt: new Date().toISOString(),
          });
          snap = await getDoc(ref);
        }

        const raw = snap.data() || {};

        // --- Migration (legacy "name" -> split to first/last ONCE) ---
        if (!raw.firstName && !raw.lastName && typeof raw.name === 'string') {
          const [first, ...rest] = raw.name.trim().split(/\s+/);
          raw.firstName = first || '';
          raw.lastName = rest.join(' ');
          await setDoc(
            ref,
            { firstName: raw.firstName, lastName: raw.lastName },
            { merge: true }
          );
        }
        if (!raw.username) {
          raw.username = fbUser.email ?? '';
          await setDoc(ref, { username: raw.username }, { merge: true });
        }
        // -------------------------------------------------------------

        const normalizedProfile = {
          firstName: raw.firstName || '',
          lastName: raw.lastName || '',
          username: raw.username || (fbUser.email ?? ''),
          role: raw.role || 'member',
          avatar: raw.avatar || '/avatars/incognito.png',
          fullName: buildFullName(raw.firstName, raw.lastName), // derived
        };

        setUser(baseUser);
        setProfile(normalizedProfile);

        // Persist session (respect previous remember choice; default true)
        const prev = loadSession();
        const remember = prev?._source ? prev._source === 'local' : true;
        saveSession(
          { user: baseUser, profile: normalizedProfile, ts: Date.now() },
          remember
        );
      } catch (err) {
        console.error('Auth state error:', err);
        setError(err.message || 'Authentication error');
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
      return true; // onAuthStateChanged will set state
    } catch (err) {
      console.error('Sign-in error:', err);
      setError(err.message || 'Failed to sign in');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  // Email/password sign-up + create profile doc (NEW SHAPE)
  async function signUp(
    {
      firstName,
      lastName,
      username, // optional; defaults to email
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
      if (!firstName || !lastName || !email || !password) {
        throw new Error(
          'First name, last name, email, and password are required.'
        );
      }

      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const ref = doc(db, 'profiles', cred.user.uid);

      await setDoc(ref, {
        firstName,
        lastName,
        username: username || email,
        role,
        avatar,
        createdAt: new Date().toISOString(),
      });

      return { uid: cred.user.uid, email: cred.user.email };
    } catch (err) {
      console.error('Sign-up error:', err);
      setError(err.message || 'Failed to sign up');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  // Google sign-in (POPUP ONLY)
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
      return result.user; // onAuthStateChanged will run
    } catch (err) {
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
