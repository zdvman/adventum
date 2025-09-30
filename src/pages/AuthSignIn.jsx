import { Button } from '@/components/catalyst-ui-kit/button';
import { Checkbox, CheckboxField } from '@/components/catalyst-ui-kit/checkbox';
import { Field, Label } from '@/components/catalyst-ui-kit/fieldset';
import { Heading } from '@/components/catalyst-ui-kit/heading';
import { Input } from '@/components/catalyst-ui-kit/input';
import { Strong, Text, TextLink } from '@/components/catalyst-ui-kit/text';
import AlertPopup from '@/components/ui/AlertPopup';
import Logo from '@/components/ui/Logo';
import { useAuth } from '@/contexts/useAuth';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';

function AuthSignIn() {
  const { signIn, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    const form = new FormData(e.target);
    const email = form.get('email');
    const password = form.get('password');
    const remember = !!form.get('remember');

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

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className='grid w-full max-w-sm grid-cols-1 gap-8'
      >
        <Logo className='h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]' />
        <Heading>Sign in to your account</Heading>

        <Field>
          <Label>Email</Label>
          <Input type='email' name='email' required />
        </Field>
        <Field>
          <Label>Password</Label>
          <Input type='password' name='password' required minLength={4} />
        </Field>

        <div className='flex items-center justify-between'>
          <CheckboxField>
            <Checkbox name='remember' />
            <Label>Remember me</Label>
          </CheckboxField>
          <Text>
            <TextLink href='#'>
              <Strong>Forgot password?</Strong>
            </TextLink>
          </Text>
        </div>
        <Button type='submit' className='w-full' disabled={loading}>
          {loading ? 'Signing in…' : 'Login'}
        </Button>
        <Text>
          Don’t have an account?{' '}
          <TextLink href='/signup'>
            <Strong>Sign up</Strong>
          </TextLink>
        </Text>
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
