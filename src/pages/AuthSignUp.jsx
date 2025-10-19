// src/pages/AuthSignUp.jsx
import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Button } from '@/components/catalyst-ui-kit/button';
import { Checkbox, CheckboxField } from '@/components/catalyst-ui-kit/checkbox';
import { Field, Label } from '@/components/catalyst-ui-kit/fieldset';
import { Heading } from '@/components/catalyst-ui-kit/heading';
import { Input } from '@/components/catalyst-ui-kit/input';
import { Strong, Text, TextLink } from '@/components/catalyst-ui-kit/text';
import AlertPopup from '@/components/ui/AlertPopup';
import Logo from '@/components/ui/Logo';
import { useAuth } from '@/contexts/useAuth';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { PRIVACY_VERSION, PRIVACY_ROUTE } from '@/utils/policy';

// Read pattern-only from env (no slashes, no quotes)
function getPasswordRegexFromEnv() {
  const raw =
    (typeof import.meta !== 'undefined' &&
      import.meta.env?.VITE_PASSWORD_REGEX) ||
    '';
  const fallback = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  if (!raw) return fallback;
  try {
    return new RegExp(raw);
  } catch {
    return fallback;
  }
}
const PASSWORD_REGEX = getPasswordRegexFromEnv();

export default function AuthSignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // alert
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');

  // form state
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touchedPw, setTouchedPw] = useState(false);
  const [touchedConfirm, setTouchedConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agreePolicy, setAgreePolicy] = useState(false); // <-- NEW

  const checks = useMemo(
    () => ({
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
      hasMinLen: password.length >= 8,
    }),
    [password]
  );

  const isPasswordValid = PASSWORD_REGEX.test(password);
  const doesConfirmMatch = confirm.length > 0 && confirm === password;

  // enable only when local fields are clearly valid (submitting handled separately)
  const canSubmit = isPasswordValid && doesConfirmMatch && agreePolicy;

  const from = location.state?.from || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    const formEl = e.currentTarget;

    if (!formEl.checkValidity()) {
      formEl.reportValidity();
      return;
    }
    if (!isPasswordValid) {
      setTouchedPw(true);
      setAlertTitle('Weak password');
      setAlertMessage('Please meet all password requirements.');
      setIsAlertOpen(true);
      return;
    }
    if (!doesConfirmMatch) {
      setTouchedConfirm(true);
      setAlertTitle('Passwords do not match');
      setAlertMessage('Make sure both password fields are identical.');
      setIsAlertOpen(true);
      return;
    }
    if (!agreePolicy) {
      setAlertTitle('Consent required');
      setAlertMessage('Please read and agree to the Privacy Policy.');
      setIsAlertOpen(true);
      return;
    }

    const form = new FormData(formEl);
    const firstName = form.get('first-name')?.toString().trim();
    const lastName = form.get('last-name')?.toString().trim();
    const usernameRaw = form.get('username')?.toString().trim();
    const email = form.get('email')?.toString().trim().toLowerCase();
    const avatar = form.get('avatar')?.toString().trim() || '';
    const remember = !!form.get('remember');

    if (!firstName || !lastName || !email || !password) {
      setAlertTitle('Missing fields');
      setAlertMessage('Please enter your name, email, and password.');
      setIsAlertOpen(true);
      return;
    }

    try {
      setSubmitting(true);
      await signUp(
        {
          firstName,
          lastName,
          username: usernameRaw || email,
          email,
          password,
          avatar,
          acceptedPolicyAt: new Date().toISOString(),
          acceptedPolicyVersion: PRIVACY_VERSION,
        },
        { remember }
      );
      navigate(from, { replace: true });
    } catch (err) {
      setAlertTitle('Sign up failed');
      setAlertMessage(err?.message || 'Could not create your account.');
      setIsAlertOpen(true);
    } finally {
      setSubmitting(false);
    }
  }

  const Requirement = ({ ok, children }) => (
    <div className='flex items-center gap-2 text-xs'>
      {ok ? (
        <CheckCircleIcon className='size-4 text-lime-400' />
      ) : (
        <ExclamationCircleIcon className='size-4 text-zinc-500' />
      )}
      <span className={ok ? 'text-zinc-300' : 'text-zinc-400'}>{children}</span>
    </div>
  );

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
          <Label>First Name</Label>
          <Input name='first-name' required />
        </Field>

        <Field>
          <Label>Last Name</Label>
          <Input name='last-name' required />
        </Field>

        <Field>
          <Label>Username (optional)</Label>
          <Input
            name='username'
            placeholder='your-nickname'
            aria-describedby='username-help'
          />
          <div id='username-help' className='mt-1 text-xs text-zinc-500'>
            If left blank, we’ll use your email as username.
          </div>
        </Field>

        <Field>
          <Label>Email</Label>
          <Input type='email' name='email' required autoComplete='email' />
        </Field>

        <Field>
          <Label>Password</Label>
          <div className='relative'>
            <Input
              type={showPassword ? 'text' : 'password'}
              name='password'
              autoComplete='new-password'
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouchedPw(true)}
              aria-invalid={touchedPw && !isPasswordValid}
            />
            <button
              type='button'
              className='absolute inset-y-0 right-2 grid place-items-center px-2 text-zinc-400 hover:text-zinc-200'
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeSlashIcon className='size-5' />
              ) : (
                <EyeIcon className='size-5' />
              )}
            </button>
          </div>

          <div className='mt-2 space-y-1'>
            <Requirement ok={checks.hasMinLen}>
              At least 8 characters
            </Requirement>
            <Requirement ok={checks.hasUpper}>
              Contains an uppercase letter
            </Requirement>
            <Requirement ok={checks.hasLower}>
              Contains a lowercase letter
            </Requirement>
            <Requirement ok={checks.hasNumber}>Contains a number</Requirement>
            <Requirement ok={checks.hasSpecial}>
              Contains a special character
            </Requirement>
          </div>
        </Field>

        <Field>
          <Label>Confirm Password</Label>
          <div className='relative'>
            <Input
              type={showConfirm ? 'text' : 'password'}
              name='confirm-password'
              autoComplete='new-password'
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onBlur={() => setTouchedConfirm(true)}
              aria-invalid={touchedConfirm && !doesConfirmMatch}
            />
            <button
              type='button'
              className='absolute inset-y-0 right-2 grid place-items-center px-2 text-zinc-400 hover:text-zinc-200'
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={
                showConfirm ? 'Hide confirm password' : 'Show confirm password'
              }
            >
              {showConfirm ? (
                <EyeSlashIcon className='size-5' />
              ) : (
                <EyeIcon className='size-5' />
              )}
            </button>
          </div>
          {touchedConfirm && !doesConfirmMatch && (
            <div className='mt-1 text-xs text-red-400'>
              Passwords do not match.
            </div>
          )}
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

        {/* NEW: Privacy Policy consent */}
        <CheckboxField>
          <Checkbox checked={agreePolicy} onChange={setAgreePolicy} />
          <Label>
            I have read and agree to the{' '}
            <TextLink href={PRIVACY_ROUTE} target='_blank' rel='noreferrer'>
              <Strong>Privacy Policy</Strong>
            </TextLink>
            .
          </Label>
        </CheckboxField>

        <Button
          type='submit'
          color='indigo'
          className='w-full'
          disabled={submitting || !canSubmit}
        >
          {submitting ? 'Creating account…' : 'Create account'}
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
