import { Button } from '@/components/catalyst-ui-kit/button';
import { Checkbox, CheckboxField } from '@/components/catalyst-ui-kit/checkbox';
import { Field, Label } from '@/components/catalyst-ui-kit/fieldset';
import { Heading } from '@/components/catalyst-ui-kit/heading';
import { Input } from '@/components/catalyst-ui-kit/input';
import { Strong, Text, TextLink } from '@/components/catalyst-ui-kit/text';
import AlertPopup from '@/components/ui/AlertPopup';
import Logo from '@/components/ui/Logo';
import { useAuth } from '@/contexts/useAuth';
import { useLocation, useNavigate } from 'react-router';
import { useState } from 'react';

function AuthSignUp() {
  const { signUp, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');

  // navigate back to where the guard redirected from (or home)
  const from = location.state?.from || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    const formEl = e.currentTarget;
    if (!formEl.checkValidity()) {
      // native bubble UI (email format, required, minlength, etc.)
      formEl.reportValidity();
      return;
    }

    const form = new FormData(formEl);
    const name = form.get('name')?.toString().trim();
    const email = form.get('email')?.toString().trim().toLowerCase();
    const password = form.get('password')?.toString();
    const avatar = form.get('avatar')?.toString().trim() || '';
    const remember = !!form.get('remember');

    // extra safety guard
    if (!name || !email || !password) {
      setAlertTitle('Missing fields');
      setAlertMessage('Please enter your name, email, and password.');
      setIsAlertOpen(true);
      return;
    }

    try {
      // role intentionally omitted -> defaults to "member" in the context
      await signUp({ name, email, password, avatar }, { remember });
      navigate(from, { replace: true });
    } catch (err) {
      setAlertTitle('Sign up failed');
      setAlertMessage(err?.message || 'Could not create your account.');
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
        <Heading>Create your account</Heading>

        <Field>
          <Label>Full name</Label>
          <Input name='name' required />
        </Field>

        <Field>
          <Label>Email</Label>
          <Input type='email' name='email' required />
        </Field>

        <Field>
          <Label>Password</Label>
          <Input
            type='password'
            name='password'
            autoComplete='new-password'
            required
            minLength={4}
          />
        </Field>

        <Field>
          <Label>Avatar URL (optional)</Label>
          <Input
            type='url'
            name='avatar'
            placeholder='https://example.com/me.png'
          />
        </Field>

        <CheckboxField>
          <Checkbox name='remember' />
          <Label>Keep me signed in on this device</Label>
        </CheckboxField>

        <Button type='submit' className='w-full' disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>

        <Text>
          Already have an account?{' '}
          <TextLink href='/auth/sign-in'>
            <Strong>Sign in</Strong>
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

export default AuthSignUp;
