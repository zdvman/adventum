// src/pages/AuthResetPassword.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/catalyst-ui-kit/button';
import { Field, Label } from '@/components/catalyst-ui-kit/fieldset';
import { Heading } from '@/components/catalyst-ui-kit/heading';
import { Input } from '@/components/catalyst-ui-kit/input';
import { Strong, Text, TextLink } from '@/components/catalyst-ui-kit/text';
import AlertPopup from '@/components/ui/AlertPopup';
import Logo from '@/components/ui/Logo';
import { useAuth } from '@/contexts/useAuth'; // ← use context method

export default function AuthResetPassword() {
  const navigate = useNavigate();
  const { resetPassword, loading } = useAuth();

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

    try {
      await resetPassword(email);
      setAlertTitle('Check your inbox');
      setAlertMessage(
        'If that email exists, we’ve sent a link to reset your password.'
      );
      setOnConfirm(() => () => {
        setIsAlertOpen(false);
        navigate('/auth/sign-in');
      });
    } catch (err) {
      setAlertTitle('Something went wrong');
      setAlertMessage(err.message || 'Please try again later.');
      setOnConfirm(() => () => setIsAlertOpen(false));
    } finally {
      setIsAlertOpen(true);
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
