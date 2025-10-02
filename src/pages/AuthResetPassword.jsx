import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/catalyst-ui-kit/button';
import { Field, Label } from '@/components/catalyst-ui-kit/fieldset';
import { Heading } from '@/components/catalyst-ui-kit/heading';
import { Input } from '@/components/catalyst-ui-kit/input';
import { Strong, Text, TextLink } from '@/components/catalyst-ui-kit/text';
import AlertPopup from '@/components/ui/AlertPopup';
import Logo from '@/components/ui/Logo';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function randomToken(len = 32) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < len; i++)
    out += chars[(Math.random() * chars.length) | 0];
  return out;
}

export default function AuthResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Popup state
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState(() => () => setIsAlertOpen(false));

  async function handleSubmit(e) {
    e.preventDefault();
    const formEl = e.currentTarget;
    if (!formEl.checkValidity()) {
      formEl.reportValidity();
      return;
    }

    const form = new FormData(formEl);
    const email = form.get('email')?.toString().trim().toLowerCase();
    if (!email) {
      setAlertTitle('Missing email');
      setAlertMessage('Please enter your email.');
      setOnConfirm(() => () => setIsAlertOpen(false));
      setIsAlertOpen(true);
      return;
    }

    setLoading(true);
    try {
      // 1) Look up the user
      const res = await fetch(
        `${API_BASE}/users?email=${encodeURIComponent(email)}`
      );
      if (!res.ok) throw new Error('Failed to connect to server');
      const users = await res.json();
      const user = users[0];

      if (!user) {
        // Don’t leak info about which emails exist in production,
        // but for dev we can be explicit:
        setAlertTitle('Email not found');
        setAlertMessage('We could not find an account with that email.');
        setOnConfirm(() => () => setIsAlertOpen(false));
        setIsAlertOpen(true);
        return;
      }

      // 2) Simulate issuing a reset token (json-server PATCH)
      const token = randomToken(32);
      await fetch(`${API_BASE}/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetPending: true,
          resetToken: token,
          resetRequestedAt: new Date().toISOString(),
        }),
      });

      // 3) Show success and send them back to sign-in
      setAlertTitle('Check your inbox');
      setAlertMessage(
        'If that email exists, we’ve sent a password reset link. For this demo, your reset was recorded — you can now sign in or continue.'
      );
      setOnConfirm(() => () => {
        setIsAlertOpen(false);
        navigate('/auth/sign-in');
      });
      setIsAlertOpen(true);
    } catch (err) {
      setAlertTitle('Something went wrong');
      setAlertMessage(err.message || 'Please try again later.');
      setOnConfirm(() => () => setIsAlertOpen(false));
      setIsAlertOpen(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className='grid w-full max-w-sm grid-cols-1 gap-8'
        noValidate
      >
        <Logo className='h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]' />
        <Heading>Reset your password</Heading>
        <Text>
          Enter your email and we’ll send you a link to reset your password.
        </Text>

        <Field>
          <Label>Email</Label>
          <Input type='email' name='email' required />
        </Field>

        <Button type='submit' className='w-full' disabled={loading}>
          {loading ? 'Sending…' : 'Reset password'}
        </Button>

        <Text>
          Don’t have an account?{' '}
          <TextLink href='/auth/sign-up'>
            <Strong>Sign up</Strong>
          </TextLink>
        </Text>

        <Text>
          Remembered your password?{' '}
          <TextLink href='/auth/sign-in'>
            <Strong>Sign in</Strong>
          </TextLink>
        </Text>
      </form>

      <AlertPopup
        isOpen={isAlertOpen}
        setIsOpen={setIsAlertOpen}
        onConfirm={onConfirm}
        title={alertTitle}
        description={alertMessage}
        confirmText='OK'
      />
    </>
  );
}
