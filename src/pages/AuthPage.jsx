import { Button } from '@/components/catalyst-ui-kit/button';
import { Checkbox, CheckboxField } from '@/components/catalyst-ui-kit/checkbox';
import { Field, Label } from '@/components/catalyst-ui-kit/fieldset';
import { Heading } from '@/components/catalyst-ui-kit/heading';
import { Input } from '@/components/catalyst-ui-kit/input';
import { Strong, Text, TextLink } from '@/components/catalyst-ui-kit/text';
import Logo from '@/components/ui/Logo';
import { useAuth } from '@/contexts/useAuth';
import { useState } from 'react';
import { useNavigate } from 'react-router';

function AuthPage() {
  const { signIn, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.target);
    const email = form.get('email');
    const password = form.get('password');
    const remember = !!form.get('remember');

    try {
      await signIn(email, password, { remember });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='grid w-full max-w-sm grid-cols-1 gap-8'
    >
      <Logo className='h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]' />
      <Heading>Sign in to your account</Heading>
      {error && (
        <div className='rounded-md bg-red-100 p-2 text-red-800 text-sm'>
          {error}
        </div>
      )}

      <Field>
        <Label>Email</Label>
        <Input type='email' name='email' requied />
      </Field>
      <Field>
        <Label>Password</Label>
        <Input type='password' name='password' required />
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
  );
}

export default AuthPage;
