import { Button } from '@/components/catalyst-ui-kit/button';
import { Checkbox, CheckboxField } from '@/components/catalyst-ui-kit/checkbox';
import { Field, Label } from '@/components/catalyst-ui-kit/fieldset';
import { Heading } from '@/components/catalyst-ui-kit/heading';
import { Input } from '@/components/catalyst-ui-kit/input';
import { Strong, Text, TextLink } from '@/components/catalyst-ui-kit/text';
import Logo from '@/components/Logo';

function AuthPage() {
  return (
    <form
      action='#'
      method='POST'
      className='grid w-full max-w-sm grid-cols-1 gap-8'
    >
      <Logo className='h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]' />
      <Heading>Sign in to your account</Heading>
      <Field>
        <Label>Email</Label>
        <Input type='email' name='email' />
      </Field>
      <Field>
        <Label>Password</Label>
        <Input type='password' name='password' />
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
      <Button type='submit' className='w-full'>
        Login
      </Button>
      <Text>
        Don’t have an account?{' '}
        <TextLink href='#'>
          <Strong>Sign up</Strong>
        </TextLink>
      </Text>
    </form>
  );
}

export default AuthPage;
