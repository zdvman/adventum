// src/pages/AuthSignIn.jsx
import { Button } from '@/components/catalyst-ui-kit/button';
import { Checkbox, CheckboxField } from '@/components/catalyst-ui-kit/checkbox';
import { Field, Label } from '@/components/catalyst-ui-kit/fieldset';
import { Heading } from '@/components/catalyst-ui-kit/heading';
import { Input } from '@/components/catalyst-ui-kit/input';
import { Strong, Text, TextLink } from '@/components/catalyst-ui-kit/text';
import AlertPopup from '@/components/ui/AlertPopup';
import GoogleSVG from '@/components/ui/GoogleSVG';
import Logo from '@/components/ui/Logo';
import { useAuth } from '@/contexts/useAuth';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  PRIVACY_VERSION,
  PRIVACY_ROUTE,
  getLocalPrivacyAccepted,
  setLocalPrivacyAccepted,
} from '@/utils/policy';

function AuthSignIn() {
  const { signIn, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [remember, setRemember] = useState(false);
  const [agreeGoogle, setAgreeGoogle] = useState(() =>
    getLocalPrivacyAccepted()
  );
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');

  const from = location.state?.from || '/';

  async function handleSubmit(e) {
    e.preventDefault();

    const formEl = e.currentTarget;
    if (!formEl.checkValidity()) {
      formEl.reportValidity();
      return;
    }

    const form = new FormData(formEl);
    const email = form.get('email')?.toString().trim();
    const password = form.get('password')?.toString();

    if (!email || !password) {
      setAlertTitle('Missing fields');
      setAlertMessage('Please enter both email and password.');
      setIsAlertOpen(true);
      return;
    }

    try {
      await signIn(email, password, { remember });
      navigate(from, { replace: true });
    } catch (err) {
      if (err?.code === 'auth/user-disabled') {
        setAlertTitle('Account blocked');
        setAlertMessage('Your account is blocked. Please contact support.');
      } else {
        setAlertTitle('Login failed');
        setAlertMessage(err.message || 'Invalid email or password.');
      }
      setIsAlertOpen(true);
    }
  }

  async function handleGoogle(e) {
    e.preventDefault();
    if (!agreeGoogle) {
      setAlertTitle('Consent required');
      setAlertMessage(
        'Please agree to the Privacy Policy to continue with Google.'
      );
      setIsAlertOpen(true);
      return;
    }
    setLocalPrivacyAccepted();
    try {
      await signInWithGoogle({
        remember,
        acceptedPolicyAt: new Date().toISOString(),
        acceptedPolicyVersion: PRIVACY_VERSION,
      });
      navigate(from, { replace: true });
    } catch (err) {
      if (err?.code === 'auth/user-disabled') {
        setAlertTitle('Account blocked');
        setAlertMessage('Your account is blocked. Please contact support.');
      } else {
        setAlertTitle('Login failed');
        setAlertMessage(err.message || 'Google sign-in error');
      }
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
        <Heading>Sign in to your account</Heading>

        <Field>
          <Label>Email</Label>
          <Input type='email' name='email' required autoComplete='email' />
        </Field>

        <Field>
          <Label>Password</Label>
          <Input
            type='password'
            name='password'
            required
            minLength={8}
            autoComplete='current-password'
          />
        </Field>

        <div className='flex items-center justify-between'>
          <CheckboxField>
            <Checkbox
              name='remember'
              checked={remember}
              onChange={setRemember}
            />
            <Label>Remember me</Label>
          </CheckboxField>
          <Text>
            <TextLink href='/auth/reset'>
              <Strong>Forgot password?</Strong>
            </TextLink>
          </Text>
        </div>

        <Button
          type='submit'
          className='w-full'
          disabled={loading}
          color='indigo'
        >
          {loading ? 'Signing in…' : 'Login'}
        </Button>

        <Text>
          Don’t have an account?{' '}
          <TextLink href='/auth/sign-up'>
            <Strong>Sign up</Strong>
          </TextLink>
        </Text>

        <div>
          <div className='flex items-center gap-x-6'>
            <div className='w-full flex-1 border-t border-white/10' />
            <p className='text-sm/6 font-medium text-nowrap text-white'>
              Or continue with
            </p>
            <div className='w-full flex-1 border-t border-white/10' />
          </div>

          {/* NEW: Consent for Google */}
          <div className='mt-6'>
            <CheckboxField>
              <Checkbox checked={agreeGoogle} onChange={setAgreeGoogle} />
              <Label>
                I agree to the{' '}
                <TextLink href={PRIVACY_ROUTE} target='_blank' rel='noreferrer'>
                  <Strong>Privacy Policy</Strong>
                </TextLink>{' '}
                to continue with Google.
              </Label>
            </CheckboxField>
          </div>

          <div className='mt-4 grid grid-cols-2 gap-4'>
            <Button
              type='button'
              onClick={handleGoogle}
              disabled={loading || !agreeGoogle}
              className='flex w-full items-center justify-center gap-3 bg-white/10'
              title={
                !agreeGoogle
                  ? 'Please agree to the Privacy Policy first'
                  : undefined
              }
            >
              <GoogleSVG />
              <span className='text-sm/6 font-semibold'>Google</span>
            </Button>

            <Button
              type='button'
              disabled
              className='flex w-full items-center justify-center gap-3 bg-white/10 opacity-60'
            >
              <span className='text-sm/6 font-semibold'>GitHub</span>
            </Button>
          </div>
        </div>
      </form>

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

export default AuthSignIn;
