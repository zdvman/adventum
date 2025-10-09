// src/pages/AuthAction.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { applyActionCode, checkActionCode, reload } from 'firebase/auth';
import { auth } from '@/services/firebase';
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
