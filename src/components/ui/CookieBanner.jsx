// src/components/ui/CookieBanner.jsx
import { useEffect, useState } from 'react';
import { Button } from '@/components/catalyst-ui-kit/button';
import { Link } from 'react-router-dom';
import { PRIVACY_ROUTE } from '@/utils/policy';
import AlertPopup from '@/components/ui/AlertPopup';

const STORAGE_KEY = 'cookie-consent-v1';

export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  // AlertPopup state
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('Notice');
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    try {
      const val = localStorage.getItem(STORAGE_KEY);
      if (!val) setOpen(true);
    } catch (err) {
      console.error('Could not access localStorage', err);
      // If storage isn’t available (private mode / strict browser), warn the user.
      setAlertTitle('We couldn’t save your preference');
      setAlertMessage(
        'Local storage is blocked or unavailable. You can still use the site, but your cookie preference may not be remembered on your next visit.'
      );
      setIsAlertOpen(true);
      // Still show the banner for transparency.
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  return (
    <>
      <div className='fixed inset-x-0 bottom-0 z-50'>
        <div className='mx-auto max-w-5xl rounded-t-xl border border-white/10 bg-zinc-900/90 p-4 backdrop-blur'>
          <div className='flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <p className='text-sm text-zinc-300'>
              We use essential cookies to sign you in and process payments.{' '}
              <Link
                to={`${PRIVACY_ROUTE}#cookies`}
                className='text-indigo-400 hover:underline'
              >
                Learn more
              </Link>
              .
            </p>
            <div className='flex gap-2'>
              <Button
                color='zinc'
                outline
                onClick={() => setOpen(false)}
                className='text-sm'
                title='Hide this message for now'
              >
                Dismiss
              </Button>
              <Button
                color='indigo'
                onClick={() => {
                  try {
                    localStorage.setItem(
                      STORAGE_KEY,
                      JSON.stringify({ acceptedAt: new Date().toISOString() })
                    );
                  } catch (err) {
                    console.error('Could not access localStorage', err);
                    setAlertTitle('We couldn’t save your preference');
                    setAlertMessage(
                      'Local storage is blocked or unavailable. Your acceptance will only apply to this session.'
                    );
                    setIsAlertOpen(true);
                  } finally {
                    setOpen(false);
                  }
                }}
                className='text-sm'
              >
                I understand
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AlertPopup
        isOpen={isAlertOpen}
        setIsOpen={setIsAlertOpen}
        title={alertTitle}
        description={alertMessage}
        confirmText='OK'
      />
    </>
  );
}
