// src/pages/AccountSettings.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';

import { Avatar } from '@/components/catalyst-ui-kit/avatar';
import { Button } from '@/components/catalyst-ui-kit/button';
import { Field, Label } from '@/components/catalyst-ui-kit/fieldset';
import { Input } from '@/components/catalyst-ui-kit/input';
import { Textarea } from '@/components/catalyst-ui-kit/textarea'; // if you have this; else use <textarea>
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import AlertPopup from '@/components/ui/AlertPopup';

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, loading, initializing } = useAuth();

  // local form state
  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [lastName, setLastName] = useState(profile?.lastName || '');
  const [username, setUsername] = useState(
    profile?.username || user?.email || ''
  );
  const [about, setAbout] = useState(profile?.about || '');
  const [avatar, setAvatar] = useState(
    profile?.avatar || '/avatars/incognito.png'
  );
  const [address, setAddress] = useState(profile?.address || null); // may be null

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  // if profile comes in after mount (first render), sync once
  useEffect(() => {
    setFirstName(profile?.firstName || '');
    setLastName(profile?.lastName || '');
    setUsername(profile?.username || user?.email || '');
    setAbout(profile?.about || '');
    setAvatar(profile?.avatar || '/avatars/incognito.png');
    setAddress(profile?.address || null);
  }, [profile, user?.email]);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: (username || '').trim() || user?.email || '',
        avatar: (avatar || '').trim() || '/avatars/incognito.png',
        about,
        // Save address exactly (null or object)
        address:
          (address && { // sanitize minimal fields
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
          }) ||
          null,
      });

      setAlertTitle('Profile updated');
      setAlertMessage('Your settings have been saved.');
      setIsAlertOpen(true);
    } catch (err) {
      setAlertTitle('Update failed');
      setAlertMessage(err?.message || 'Please try again.');
      setIsAlertOpen(true);
    }
  }

  if (initializing) {
    // Optional: show your global loading page/spinner
    return null;
  }

  return (
    <>
      <form onSubmit={handleSubmit} className='space-y-12'>
        {/* Profile */}
        <section className='border-b border-white/10 pb-10'>
          <h2 className='text-base/7 font-semibold text-white'>Profile</h2>
          <p className='mt-1 text-sm/6 text-gray-400'>
            This information may be visible to other users.
          </p>

          <div className='mt-8 grid grid-cols-1 gap-6 sm:grid-cols-6'>
            <div className='sm:col-span-3'>
              <Field>
                <Label>First name</Label>
                <Input
                  name='first-name'
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete='given-name'
                />
              </Field>
            </div>

            <div className='sm:col-span-3'>
              <Field>
                <Label>Last name</Label>
                <Input
                  name='last-name'
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete='family-name'
                />
              </Field>
            </div>

            <div className='sm:col-span-4'>
              <Field>
                <Label>Username</Label>
                <div className='flex items-center rounded-md bg-white/5 pl-3 outline-1 -outline-offset-1 outline-white/10 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-500'>
                  <div className='shrink-0 text-base text-gray-400 select-none sm:text-sm/6'>
                    adventum.com/
                  </div>
                  <input
                    id='username'
                    name='username'
                    type='text'
                    className='block min-w-0 grow bg-transparent py-1.5 pr-3 pl-1 text-base text-white placeholder:text-gray-500 focus:outline-none sm:text-sm/6'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </Field>
            </div>

            <div className='col-span-full'>
              <Field>
                <Label>About</Label>
                {/* If you don’t have <Textarea/> in the kit, use <textarea/> styled like your inputs */}
                <Textarea
                  rows={3}
                  name='about'
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                />
              </Field>
            </div>

            <div className='col-span-full'>
              <Field>
                <Label>Avatar URL</Label>
                <div className='flex items-center gap-3'>
                  {avatar ? (
                    <Avatar src={avatar} className='size-12' />
                  ) : (
                    <div className='size-12 rounded-full bg-white/10' />
                  )}
                  <Input
                    name='avatar'
                    type='url'
                    placeholder='https://example.com/me.png'
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                  />
                </div>
              </Field>
            </div>
          </div>
        </section>

        {/* Personal Information – Address (optional) */}
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

        {/* Actions */}
        <div className='mt-6 flex items-center justify-end gap-x-6'>
          <Button plain type='button' onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button color='indigo' type='submit' disabled={loading}>
            {loading ? 'Saving…' : 'Save'}
          </Button>
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
