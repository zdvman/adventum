// src/pages/AccountSettings.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';

import { Avatar } from '@/components/catalyst-ui-kit/avatar';
import { Button } from '@/components/catalyst-ui-kit/button';
import {
  Description,
  Field,
  Label,
} from '@/components/catalyst-ui-kit/fieldset';
import { Input } from '@/components/catalyst-ui-kit/input';
import { Textarea } from '@/components/catalyst-ui-kit/textarea';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import AlertPopup from '@/components/ui/AlertPopup';

import { auth } from '@/services/firebase';
import { Heading } from '@/components/catalyst-ui-kit/heading';
import { Text } from '@/components/catalyst-ui-kit/text';
import Loading from '@/components/ui/Loading';

export default function AccountSettings() {
  const navigate = useNavigate();
  const {
    user,
    profile,
    updateProfile,
    updateAuthEmail,
    changePassword,
    deleteAccount,
    // reauthWithGoogle,
    loading,
    initializing,
  } = useAuth();

  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // profile section state
  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [lastName, setLastName] = useState(profile?.lastName || '');
  const [username, setUsername] = useState(
    profile?.username || user?.email || ''
  );
  const [about, setAbout] = useState(profile?.about || '');
  const [avatar, setAvatar] = useState(
    profile?.avatar || '/avatars/incognito.png'
  );
  const [address, setAddress] = useState(profile?.address || null);

  // email/password sections state
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [currentPwForEmail, setCurrentPwForEmail] = useState(''); // only for email/password users
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmNewPw, setConfirmNewPw] = useState('');

  // danger zone
  const [currentPwForDelete, setCurrentPwForDelete] = useState('');

  // alerts
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  // sync on profile load
  useEffect(() => {
    setFirstName(profile?.firstName || '');
    setLastName(profile?.lastName || '');
    setUsername(profile?.username || user?.email || '');
    setAbout(profile?.about || '');
    setAvatar(profile?.avatar || '/avatars/incognito.png');
    setAddress(profile?.address || null);
    setNewEmail(user?.email || '');
  }, [profile, user?.email]);

  // --- Save profile (FireStore doc only) ---
  async function handleSaveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: (username || '').trim() || user?.email || '',
        avatar: (avatar || '').trim() || '/avatars/incognito.png',
        about,
        address: address
          ? {
              line1: address.line1 || '',
              line2: address.line2 || '',
              city: address.city || '',
              region: address.region || '',
              postalCode: address.postalCode || '',
              countryCode: address.countryCode || '',
              countryName: address.countryName || '',
              lat: typeof address.lat === 'number' ? address.lat : null,
              lng: typeof address.lng === 'number' ? address.lng : null,
              placeId: address.placeId || '',
            }
          : null,
      });
      setAlertTitle('Profile updated');
      setAlertMessage('Your settings have been saved.');
      setIsAlertOpen(true);
    } catch (err) {
      setAlertTitle('Update failed');
      setAlertMessage(err?.message || 'Please try again.');
      setIsAlertOpen(true);
    } finally {
      setSavingProfile(false);
    }
  }

  // --- Update email (Firebase Auth) ---
  async function handleUpdateEmail(e) {
    e.preventDefault();
    setUpdatingEmail(true);
    try {
      const usingGoogle = !authHasPasswordProvider();
      await updateAuthEmail({
        newEmail: newEmail.trim(),
        currentPassword: usingGoogle ? undefined : currentPwForEmail,
        viaGoogle: usingGoogle,
      });

      setCurrentPwForEmail('');
      setAlertTitle('Verify your new email');
      setAlertMessage(
        'We sent a verification link to your new address. Click it to finish changing your login email.'
      );
      setIsAlertOpen(true);
    } catch (err) {
      setAlertTitle('Email update failed');
      setAlertMessage(
        err?.message || 'Please re-check your password and try again.'
      );
      setIsAlertOpen(true);
    } finally {
      setUpdatingEmail(false);
    }
  }

  // --- Change password (Firebase Auth) ---
  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPw !== confirmNewPw) {
      setAlertTitle('Passwords do not match');
      setAlertMessage('Please make sure the new passwords match.');
      setIsAlertOpen(true);
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword({ currentPassword: currentPw, newPassword: newPw });
      setCurrentPw('');
      setNewPw('');
      setConfirmNewPw('');
      setAlertTitle('Password changed');
      setAlertMessage('Your password has been updated.');
      setIsAlertOpen(true);
    } catch (err) {
      setAlertTitle('Password change failed');
      setAlertMessage(
        err?.message || 'Please re-check your current password and try again.'
      );
      setIsAlertOpen(true);
    } finally {
      setChangingPassword(false);
    }
  }

  // --- Delete account (Firestore doc + Auth user) ---
  async function handleDeleteAccount(e) {
    e.preventDefault();
    const ok = confirm(
      'This will permanently delete your account and profile. This cannot be undone. Continue?'
    );
    if (!ok) return;

    setDeleting(true);
    try {
      const usingGoogle = !authHasPasswordProvider(user);
      await deleteAccount({
        currentPassword: usingGoogle ? undefined : currentPwForDelete,
        viaGoogle: usingGoogle,
      });
      // navigate user away (auth state will be cleared)
      navigate('/');
    } catch (err) {
      setAlertTitle('Delete failed');
      setAlertMessage(err?.message || 'Unable to delete your account.');
      setIsAlertOpen(true);
    } finally {
      setDeleting(false);
    }
  }

  if (initializing) return null;

  const usingGoogle = !authHasPasswordProvider(user);

  return (
    <>
      {/* PROFILE */}
      <form onSubmit={handleSaveProfile} className='space-y-12'>
        <section className='border-b border-white/10 pb-10'>
          <Heading>Account settings</Heading>
          <Text>This information may be visible to other users.</Text>
          <div className='mt-8 grid grid-cols-1 gap-6 sm:grid-cols-6'>
            <div className='sm:col-span-2'>
              <Field>
                <Label>First name</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </Field>
            </div>
            <div className='sm:col-span-2'>
              <Field>
                <Label>Last name</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </Field>
            </div>
            <div className='sm:col-span-2'>
              <Field>
                <Label>Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Field>
            </div>

            <div className='col-span-full'>
              <Field>
                <Label>About</Label>
                <Description>
                  A short bio to introduce yourself to others.
                </Description>
                <Textarea
                  rows={3}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                />
              </Field>
            </div>

            <div className='sm:col-span-2'>
              <Avatar src={avatar} className='size-80' />
            </div>
            <div className='sm:col-span-4'>
              <Field>
                <Label>Avatar URL</Label>
                <Description>URL of your profile picture.</Description>
                <Input
                  type='url'
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                />
              </Field>
            </div>
          </div>
        </section>

        {/* ADDRESS (optional) */}
        <section className='border-b border-white/10 pb-10'>
          <h2 className='text-base/7 font-semibold text-white'>
            Personal information
          </h2>
          <p className='mt-1 text-sm/6 text-gray-400'>
            Add an address if you want to use it for tickets, invoices, or venue
            creation. You can leave it empty.
          </p>
          <div className='mt-8 grid grid-cols-1 gap-6'>
            <AddressAutocomplete value={address} onChange={setAddress} />
          </div>
        </section>

        <div className='mt-2 flex items-center justify-end gap-x-6'>
          <Button plain type='button' onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button color='indigo' type='submit' disabled={loading}>
            {savingProfile ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
      {savingProfile && <Loading />}

      {/* ACCOUNT: EMAIL */}
      <form
        onSubmit={handleUpdateEmail}
        className='mt-12 space-y-6 border-t border-white/10 pt-10'
      >
        <h3 className='text-base/7 font-semibold text-white'>Login email</h3>
        <div className='max-w-lg space-y-4'>
          <Field>
            <Label>New email</Label>
            <Input
              type='email'
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </Field>

          {!usingGoogle && (
            <Field>
              <Label>Current password</Label>
              <Input
                type='password'
                value={currentPwForEmail}
                onChange={(e) => setCurrentPwForEmail(e.target.value)}
                placeholder='Required to confirm email change'
                required
              />
            </Field>
          )}

          {usingGoogle && (
            <p className='text-sm text-zinc-400'>
              You signed in with Google. We’ll ask you to reauthenticate with a
              Google popup.
            </p>
          )}

          <Button color='indigo' type='submit' disabled={loading}>
            {updatingEmail ? 'Updating…' : 'Update email'}
          </Button>
        </div>
      </form>
      {updatingEmail && <Loading />}

      {/* ACCOUNT: PASSWORD */}
      {!usingGoogle && (
        <>
          <form
            onSubmit={handleChangePassword}
            className='mt-12 space-y-6 border-t border-white/10 pt-10'
          >
            <h3 className='text-base/7 font-semibold text-white'>
              Change password
            </h3>
            <div className='max-w-lg space-y-4'>
              <Field>
                <Label>Current password</Label>
                <Input
                  type='password'
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <Label>New password</Label>
                <Input
                  type='password'
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <Label>Confirm new password</Label>
                <Input
                  type='password'
                  value={confirmNewPw}
                  onChange={(e) => setConfirmNewPw(e.target.value)}
                  required
                />
              </Field>
              <Button color='indigo' type='submit' disabled={loading}>
                {changingPassword ? 'Updating…' : 'Change password'}
              </Button>
            </div>
          </form>
          {changingPassword && <Loading />}
        </>
      )}

      {/* DANGER ZONE */}
      <form
        onSubmit={handleDeleteAccount}
        className='mt-12 space-y-6 border-t border-white/10 pt-10'
      >
        <h3 className='text-base/7 font-semibold text-white'>Danger zone</h3>
        <p className='text-sm text-red-400'>
          Deleting your account is permanent.
        </p>

        {!usingGoogle && (
          <div className='max-w-lg space-y-4'>
            <Field>
              <Label>Confirm with current password</Label>
              <Input
                type='password'
                value={currentPwForDelete}
                onChange={(e) => setCurrentPwForDelete(e.target.value)}
                required
              />
            </Field>
          </div>
        )}

        {usingGoogle && (
          <p className='text-sm text-zinc-400'>
            You signed in with Google. We’ll ask you to reauthenticate in a
            popup before deletion.
          </p>
        )}

        <Button type='submit' className='bg-red-600 hover:bg-red-700'>
          {deleting ? 'Deleting…' : 'Delete account'}
        </Button>
      </form>
      {deleting && <Loading />}

      <AlertPopup
        isOpen={isAlertOpen}
        setIsOpen={setIsAlertOpen}
        title={alertTitle}
        description={alertMessage}
        confirmText='OK'
      />

      {(savingProfile ||
        updatingEmail ||
        changingPassword ||
        deleting ||
        loading) && (
        <Loading
          label={
            deleting
              ? 'Deleting account…'
              : savingProfile
              ? 'Saving profile…'
              : updatingEmail
              ? 'Updating email…'
              : changingPassword
              ? 'Changing password…'
              : 'Working…'
          }
        />
      )}
    </>
  );
}

// Determine whether the signed-in user has the password provider
function authHasPasswordProvider() {
  return !!auth.currentUser?.providerData?.some(
    (p) => p.providerId === 'password'
  );
}
