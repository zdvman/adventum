// src/pages/AuthAction.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { applyActionCode, checkActionCode, reload } from 'firebase/auth';
import { auth, db } from '@/services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import AlertPopup from '@/components/ui/AlertPopup';

export default function AuthAction() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [title, setTitle] = useState('Processing…');
  const [msg, setMsg] = useState('Please wait…');

  useEffect(() => {
    (async () => {
      // const mode = params.get('mode');       // 'verifyAndChangeEmail'
      const oobCode = params.get('oobCode'); // required
      if (!oobCode) {
        setTitle('Invalid link');
        setMsg('Missing action code.');
        return;
      }
      try {
        await checkActionCode(auth, oobCode);
        await applyActionCode(auth, oobCode);
        if (auth.currentUser) await reload(auth.currentUser);
        // Mirror the new auth email into the profile (if user is signed in)
        if (auth.currentUser?.uid) {
          await updateDoc(doc(db, 'profiles', auth.currentUser.uid), {
            email: auth.currentUser.email || '',
            updatedAt: new Date().toISOString(),
          });
        }
        setTitle('Email updated');
        setMsg('Your login email has been changed successfully.');
      } catch (e) {
        setTitle('Link error');
        setMsg(e?.message || 'This link is invalid or expired.');
      }
    })();
  }, [params]);

  return (
    <AlertPopup
      isOpen={open}
      setIsOpen={setOpen}
      title={title}
      description={msg}
      confirmText='OK'
      onConfirm={() => navigate('/auth/sign-in')}
    />
  );
}
