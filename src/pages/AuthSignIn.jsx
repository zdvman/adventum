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

function AuthSignIn() {
  const { signIn, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [remember, setRemember] = useState(false);
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
      setAlertTitle('Login failed');
      setAlertMessage(err.message || 'Invalid email or password.');
      setIsAlertOpen(true);
    }
  }

  async function handleGoogle(e) {
    e.preventDefault();
    try {
      await signInWithGoogle({ remember });
      // If popup succeeds, we get here immediately.
      // If redirect fallback is used, this line may not run (page will redirect),
      // and onAuthStateChanged will handle session after redirect.
      navigate(from, { replace: true });
    } catch (err) {
      setAlertTitle('Login failed');
      setAlertMessage(err.message || 'Google sign-in error');
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

        <Button type='submit' className='w-full' disabled={loading}>
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

          <div className='mt-6 grid grid-cols-2 gap-4'>
            <Button
              type='button'
              onClick={handleGoogle}
              disabled={loading}
              className='flex w-full items-center justify-center gap-3 bg-white/10'
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
