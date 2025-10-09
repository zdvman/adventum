// src/contexts/AuthContextProvider.jsx
import { useEffect, useMemo, useState } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { clearSession, loadSession, saveSession } from '@/utils/storage';

import { auth, db, ACTION_CODE_SETTINGS } from '@/services/firebase';
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
  // NEW:
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
  updatePassword as fbUpdatePassword,
  deleteUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

function buildFullName(firstName, lastName) {
  const parts = [firstName || '', lastName || '']
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.join(' ');
}

export function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null); // { uid, email }
  const [profile, setProfile] = useState(null); // { firstName, lastName, username, role, avatar, fullName, about?, address? }
  const [initializing, setInitializing] = useState(true); // <— NEW (boot only)
  const [loading, setLoading] = useState(false); // <— for actions
  const [error, setError] = useState(null);

  useEffect(() => {
    // Pre-hydrate (faster first paint)
    const stored = loadSession();
    if (stored?.user && stored?.profile) {
      setUser(stored.user);
      setProfile(stored.profile);
      // Keep `initializing` true; Firebase is still the source of truth.
    }

    // Source of truth: Firebase Auth state
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (!fbUser) {
          clearSession();
          setUser(null);
          setProfile(null);
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
            about: '',
            address: null, // <- optional
            createdAt: new Date().toISOString(),
          });
          snap = await getDoc(ref);
        }

        const raw = snap.data() || {};

        if (!raw.username) {
          raw.username = fbUser.email ?? '';
          await setDoc(ref, { username: raw.username }, { merge: true });
        }
        // -----------------------------------------------------

        const normalizedProfile = {
          firstName: raw.firstName || '',
          lastName: raw.lastName || '',
          username: raw.username || (fbUser.email ?? ''),
          role: raw.role || 'member',
          avatar: raw.avatar || '/avatars/incognito.png',
          about: raw.about || '',
          address: raw.address || null, // may be null
          fullName: buildFullName(raw.firstName, raw.lastName),
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
        setInitializing(false); // <— FINISH BOOT PHASE HERE
      }
    });

    return () => unsub();
  }, []);

  // Actions (use loading)
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

  // Email/password sign-up + create profile doc
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
        about: '',
        address: null,
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
      return result.user;
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

  // Update profile document (partial fields)
  async function updateProfile(partial) {
    if (!user?.uid) throw new Error('Not signed in');
    setLoading(true);
    setError(null);
    try {
      const ref = doc(db, 'profiles', user.uid);
      await setDoc(ref, partial, { merge: true });

      const next = {
        ...(profile || {}),
        ...partial,
      };

      // keep derived fullName in sync
      next.fullName = buildFullName(next.firstName, next.lastName);

      setProfile(next);

      const prev = loadSession();
      const remember = prev?._source ? prev._source === 'local' : true;
      saveSession({ user, profile: next, ts: Date.now() }, remember);
      return next;
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.message || 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  // --- Reauthenticate helpers ----------------------------------------------

  // Email/password reauth using current password
  async function reauthWithPassword(currentPassword) {
    if (!user?.uid || !auth.currentUser?.email) {
      throw new Error('No authenticated user.');
    }
    const cred = EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword
    );
    await reauthenticateWithCredential(auth.currentUser, cred);
  }

  // Google reauth (popup)
  async function reauthWithGoogle() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider); // This counts as recent login
  }

 // --- Account: update email ------------------------------------------------
// For email/password accounts → provide { currentPassword }.
// For Google accounts → provide { viaGoogle: true } and omit currentPassword.
async function updateAuthEmail({ newEmail, currentPassword, viaGoogle = false }) {
  if (!auth.currentUser) throw new Error('Not signed in.');
  setLoading(true);
  setError(null);
  try {
    if (viaGoogle) {
      // reauth via Google popup
      await reauthWithGoogle();
    } else {
      if (!currentPassword) throw new Error('Current password is required.');
      // reauth with current password
      const cred = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, cred);
    }

    // Send verification link to the NEW email
    await verifyBeforeUpdateEmail(auth.currentUser, newEmail, ACTION_CODE_SETTINGS);

    // Actual switch happens after the user clicks the link in the *new* inbox
    return true;
  } catch (err) {
    console.error('updateAuthEmail error:', err);
    setError(err?.message || 'Failed to start email change.');
    throw err;
  } finally {
    setLoading(false);
  }
}


  // --- Account: change password --------------------------------------------
  // For email/password users: requires currentPassword
  // For Google users: they don't have a password (usually) → not applicable here.
  async function changePassword({ currentPassword, newPassword }) {
    if (!auth.currentUser) throw new Error('Not signed in');
    setLoading(true);
    setError(null);
    try {
      if (!currentPassword) throw new Error('Current password is required.');
      if (!newPassword) throw new Error('New password is required.');
      await reauthWithPassword(currentPassword);
      await fbUpdatePassword(auth.currentUser, newPassword);
      return true;
    } catch (err) {
      console.error('changePassword error:', err);
      setError(err.message || 'Failed to change password');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  // --- Account: delete account ---------------------------------------------
  // Deletes Firestore profile doc then Firebase user; requires recent auth.
  // For email/password: supply currentPassword.
  // For Google: use { viaGoogle: true }.
  async function deleteAccount({ currentPassword, viaGoogle = false } = {}) {
    if (!auth.currentUser) throw new Error('Not signed in');
    setLoading(true);
    setError(null);
    try {
      if (viaGoogle) {
        await reauthWithGoogle();
      } else {
        if (!currentPassword) throw new Error('Current password is required.');
        await reauthWithPassword(currentPassword);
      }

      // delete profile doc (and TODO: cascade any user-owned collections)
      const ref = doc(db, 'profiles', auth.currentUser.uid);
      await deleteDoc(ref);

      // delete auth user
      await deleteUser(auth.currentUser);

      // clear local state/session
      clearSession();
      setUser(null);
      setProfile(null);
      return true;
    } catch (err) {
      console.error('deleteAccount error:', err);
      setError(err.message || 'Failed to delete account');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  const value = useMemo(
    () => ({
      user,
      profile,
      initializing,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      signInWithGoogle,
      updateProfile,
      // NEW:
      updateAuthEmail,
      changePassword,
      deleteAccount,
      reauthWithGoogle, // optional to call from UI if you prefer
      error,
      setError,
    }),
    [user, profile, initializing, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
