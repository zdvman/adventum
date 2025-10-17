// src/pages/UserEditStaff.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Select } from '@/components/catalyst-ui-kit/select';
import { Heading } from '@/components/catalyst-ui-kit/heading';
import { Text } from '@/components/catalyst-ui-kit/text';
import Loading from '@/components/ui/Loading';
import AlertPopup from '@/components/ui/AlertPopup';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';

import {
  getProfileById,
  staffUpdateUserProfile,
  staffSetUserRole,
  staffSetUserBlocked,
  staffDeleteUserCascade,
} from '@/services/api';

export default function UserEditStaff() {
  const { profile: myProfile } = useAuth();
  const isStaff = myProfile?.role === 'staff';
  const { userId } = useParams();
  const navigate = useNavigate();

  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  // form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [about, setAbout] = useState('');
  const [avatar, setAvatar] = useState('/avatars/incognito.png');
  const [address, setAddress] = useState(null);
  const [role, setRole] = useState('member');
  const [blocked, setBlocked] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [savingBlocked, setSavingBlocked] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!isStaff) {
        setAlertTitle('Forbidden');
        setAlertMessage('Staff only.');
        setIsAlertOpen(true);
        setLoading(false);
        return;
      }
      try {
        const p = await getProfileById(userId, { fromServer: true });
        if (ignore) return;
        if (!p) {
          setAlertTitle('Not found');
          setAlertMessage('User profile not found.');
          setIsAlertOpen(true);
          setLoading(false);
          return;
        }
        setTarget(p);
        setFirstName(p.firstName || '');
        setLastName(p.lastName || '');
        setUsername(p.username || p.email || '');
        setAbout(p.about || '');
        setAvatar(p.avatar || '/avatars/incognito.png');
        setAddress(p.address || null);
        setRole(p.role || 'member');
        setBlocked(!!p.blocked);
      } catch (e) {
        setAlertTitle('Load failed');
        setAlertMessage(e?.message || 'Unable to load user profile.');
        setIsAlertOpen(true);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => (ignore = true);
  }, [isStaff, userId]);

  if (!isStaff) return null;
  if (loading) return <Loading label='Loading user…' />;

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await staffUpdateUserProfile(userId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: (username || '').trim(),
        about,
        avatar: (avatar || '').trim() || '/avatars/incognito.png',
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
      setAlertTitle('Saved');
      setAlertMessage('Profile updated.');
      setIsAlertOpen(true);
    } catch (e) {
      setAlertTitle('Save failed');
      setAlertMessage(e?.message || 'Could not update profile.');
      setIsAlertOpen(true);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveRole() {
    setSavingRole(true);
    try {
      await staffSetUserRole(userId, role);
      setAlertTitle('Role updated');
      setAlertMessage(`User role is now “${role}”.`);
      setIsAlertOpen(true);
    } catch (e) {
      setAlertTitle('Role update failed');
      setAlertMessage(e?.message || 'Could not change role.');
      setIsAlertOpen(true);
    } finally {
      setSavingRole(false);
    }
  }

  async function handleToggleBlocked() {
    setSavingBlocked(true);
    try {
      const next = !blocked;
      await staffSetUserBlocked(userId, next);
      setBlocked(next);
      setAlertTitle(next ? 'User blocked' : 'User unblocked');
      setAlertMessage(
        next
          ? 'Login disabled and profile marked as blocked.'
          : 'Login re-enabled and profile unblocked.'
      );
      setIsAlertOpen(true);
    } catch (e) {
      setAlertTitle('Update failed');
      setAlertMessage(e?.message || 'Could not change block status.');
      setIsAlertOpen(true);
    } finally {
      setSavingBlocked(false);
    }
  }

  async function handleCascadeDelete(e) {
    e.preventDefault();
    if (userId === myProfile?.id) {
      setAlertTitle('Not allowed');
      setAlertMessage('You cannot delete your own account.');
      setIsAlertOpen(true);
      return;
    }
    const label = (
      target?.username ||
      target?.firstName ||
      target?.id ||
      ''
    ).toString();
    const must = `DELETE ${label}`;
    if (confirmText !== must) {
      setAlertTitle('Confirmation required');
      setAlertMessage(`Type exactly: ${must}`);
      setIsAlertOpen(true);
      return;
    }

    setDeleting(true);
    try {
      const res = await staffDeleteUserCascade(userId);
      setAlertTitle('User deleted');
      setAlertMessage(
        `Cascade removed. Events: ${
          res?.summary?.eventsDeleted ?? 0
        }, Orders: ${res?.summary?.ordersDeleted ?? 0}`
      );
      setIsAlertOpen(true);
      navigate('/staff/users', { replace: true });
    } catch (e2) {
      setAlertTitle('Delete failed');
      setAlertMessage(e2?.message || 'Could not delete this user.');
      setIsAlertOpen(true);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className='mb-6 flex items-center justify-between'>
        <Heading>Manage user</Heading>
        <Button plain onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      {blocked && (
        <div className='mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300'>
          This user is <strong>blocked</strong>. Authentication is disabled.
        </div>
      )}

      {/* PROFILE (safe fields) */}
      <form onSubmit={handleSaveProfile} className='space-y-12'>
        <section className='border-b border-white/10 pb-10'>
          <Text>
            Staff can edit profile fields except credentials and danger actions.
          </Text>
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
                <Description>Short bio</Description>
                <Textarea
                  rows={3}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                />
              </Field>
            </div>

            <div className='sm:col-span-2'>
              <Avatar
                src={avatar || '/avatars/incognito.png'}
                className='size-80'
              />
            </div>
            <div className='sm:col-span-4'>
              <Field>
                <Label>Avatar URL</Label>
                <Input
                  type='url'
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                />
              </Field>
            </div>
          </div>
        </section>

        {/* ADDRESS */}
        <section className='border-b border-white/10 pb-10'>
          <h2 className='text-base/7 font-semibold text-white'>
            Personal information
          </h2>
          <p className='mt-1 text-sm/6 text-gray-400'>
            Optional address for tickets/invoices. Staff can edit it on behalf
            of the user.
          </p>
          <div className='mt-8 grid grid-cols-1 gap-6'>
            <AddressAutocomplete value={address} onChange={setAddress} />
          </div>
        </section>

        <div className='mt-2 flex items-center justify-end gap-x-6'>
          <Button plain type='button' onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button color='indigo' type='submit'>
            {savingProfile ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>

      {/* ADMIN CONTROLS: ROLE + BLOCK */}
      <section className='mt-12 space-y-6 border-t border-white/10 pt-10'>
        <h3 className='text-base/7 font-semibold text-white'>Admin controls</h3>
        <div className='max-w-lg space-y-4'>
          <Field>
            <Label>Role</Label>
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value='member'>Member</option>
              <option value='staff'>Staff</option>
            </Select>
          </Field>
          <div className='flex gap-3'>
            <Button
              color='zinc'
              type='button'
              onClick={handleSaveRole}
              disabled={savingRole}
            >
              {savingRole ? 'Updating…' : 'Save role'}
            </Button>
            <Button
              type='button'
              onClick={handleToggleBlocked}
              className={
                blocked
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
              disabled={savingBlocked}
            >
              {savingBlocked
                ? 'Working…'
                : blocked
                ? 'Unblock user'
                : 'Block user'}
            </Button>
          </div>
          <p className='text-xs text-zinc-400'>
            Blocking disables login (Auth user disabled) and marks the profile
            as blocked.
          </p>
        </div>
      </section>

      {/* DANGER ZONE (STAFF) */}
      <form
        onSubmit={handleCascadeDelete}
        className='mt-12 space-y-6 border-t border-white/10 pt-10'
      >
        <h3 className='text-base/7 font-semibold text-white'>Danger zone</h3>
        <p className='text-sm text-red-400'>
          Permanently delete this user and all associated events and orders.
        </p>

        <div className='max-w-lg space-y-4'>
          <Field>
            <Label>Type to confirm</Label>
            <Description>
              Type{' '}
              <code className='rounded bg-zinc-800 px-1 py-0.5'>
                DELETE{' '}
                {(
                  target?.username ||
                  target?.firstName ||
                  target?.id ||
                  ''
                ).toString()}
              </code>
            </Description>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='Exact confirmation phrase'
              required
            />
          </Field>
          <Button
            type='submit'
            className='bg-red-600 hover:bg-red-700'
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete user (cascade)'}
          </Button>
        </div>
      </form>

      {(savingProfile || savingRole || savingBlocked || deleting) && (
        <Loading
          label={
            deleting
              ? 'Deleting user…'
              : savingProfile
              ? 'Saving profile…'
              : savingRole
              ? 'Updating role…'
              : 'Updating…'
          }
        />
      )}

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
