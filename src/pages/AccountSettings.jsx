import { PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import { ChevronDownIcon } from '@heroicons/react/16/solid';
import { useAuth } from '@/contexts/useAuth';
import { Avatar } from '@/components/catalyst-ui-kit/avatar';

export default function AccountSettings() {
  const { profile } = useAuth();
  return (
    <form>
      <div className='space-y-12'>
        <div className='border-b border-white/10 pb-12'>
          <h2 className='text-base/7 font-semibold text-white'>Profile</h2>
          <p className='mt-1 text-sm/6 text-gray-400'>
            This information will be displayed publicly so be careful what you
            share.
          </p>

          <div className='mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6'>
            <div className='sm:col-span-4'>
              <label
                htmlFor='username'
                className='block text-sm/6 font-medium text-white'
              >
                Username
              </label>
              <div className='mt-2'>
                <div className='flex items-center rounded-md bg-white/5 pl-3 outline-1 -outline-offset-1 outline-white/10 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-500'>
                  <div className='shrink-0 text-base text-gray-400 select-none sm:text-sm/6'>
                    adventum.com/
                  </div>
                  <input
                    id='username'
                    name='username'
                    type='text'
                    placeholder={profile?.username || 'your-username'}
                    className='block min-w-0 grow bg-transparent py-1.5 pr-3 pl-1 text-base text-white placeholder:text-gray-500 focus:outline-none sm:text-sm/6'
                  />
                </div>
              </div>
            </div>

            <div className='col-span-full'>
              <label
                htmlFor='about'
                className='block text-sm/6 font-medium text-white'
              >
                About
              </label>
              <div className='mt-2'>
                <textarea
                  id='about'
                  name='about'
                  rows={3}
                  className='block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6'
                  defaultValue={profile?.about || ''}
                />
              </div>
              <p className='mt-3 text-sm/6 text-gray-400'>
                Write a few sentences about yourself.
              </p>
            </div>

            <div className='col-span-full'>
              <label
                htmlFor='photo'
                className='block text-sm/6 font-medium text-white'
              >
                Photo
              </label>
              <div className='mt-2 flex items-center gap-x-3'>
                {profile?.avatar ? (
                  <Avatar src={profile?.avatar} className='size-12' />
                ) : (
                  <UserCircleIcon
                    aria-hidden='true'
                    className='size-12 text-gray-500'
                  />
                )}
                <button
                  type='button'
                  className='rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white inset-ring inset-ring-white/5 hover:bg-white/20'
                >
                  Change
                </button>
              </div>
            </div>

            <div className='col-span-full'>
              <label
                htmlFor='cover-photo'
                className='block text-sm/6 font-medium text-white'
              >
                Cover photo
              </label>
              <div className='mt-2 flex justify-center rounded-lg border border-dashed border-white/25 px-6 py-10'>
                <div className='text-center'>
                  <PhotoIcon
                    aria-hidden='true'
                    className='mx-auto size-12 text-gray-600'
                  />
                  <div className='mt-4 flex text-sm/6 text-gray-400'>
                    <label
                      htmlFor='file-upload'
                      className='relative cursor-pointer rounded-md bg-transparent font-semibold text-indigo-400 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-500 hover:text-indigo-300'
                    >
                      <span>Upload a file</span>
                      <input
                        id='file-upload'
                        name='file-upload'
                        type='file'
                        className='sr-only'
                      />
                    </label>
                    <p className='pl-1'>or drag and drop</p>
                  </div>
                  <p className='text-xs/5 text-gray-400'>
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='border-b border-white/10 pb-12'>
          <h2 className='text-base/7 font-semibold text-white'>
            Personal Information
          </h2>
          <p className='mt-1 text-sm/6 text-gray-400'>
            Use a permanent address where you can receive mail.
          </p>

          <div className='mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6'>
            <div className='sm:col-span-3'>
              <label
                htmlFor='first-name'
                className='block text-sm/6 font-medium text-white'
              >
                First name
              </label>
              <div className='mt-2'>
                <input
                  id='first-name'
                  name='first-name'
                  type='text'
                  autoComplete='given-name'
                  defaultValue={profile?.firstName || ''}
                  className='block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6'
                />
              </div>
            </div>

            <div className='sm:col-span-3'>
              <label
                htmlFor='last-name'
                className='block text-sm/6 font-medium text-white'
              >
                Last name
              </label>
              <div className='mt-2'>
                <input
                  id='last-name'
                  name='last-name'
                  type='text'
                  autoComplete='family-name'
                  className='block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6'
                />
              </div>
            </div>

            <div className='sm:col-span-4'>
              <label
                htmlFor='email'
                className='block text-sm/6 font-medium text-white'
              >
                Email address
              </label>
              <div className='mt-2'>
                <input
                  id='email'
                  name='email'
                  type='email'
                  autoComplete='email'
                  className='block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6'
                />
              </div>
            </div>

            <div className='sm:col-span-3'>
              <label
                htmlFor='country'
                className='block text-sm/6 font-medium text-white'
              >
                Country
              </label>
              <div className='mt-2 grid grid-cols-1'>
                <select
                  id='country'
                  name='country'
                  autoComplete='country-name'
                  className='col-start-1 row-start-1 w-full appearance-none rounded-md bg-white/5 py-1.5 pr-8 pl-3 text-base text-white outline-1 -outline-offset-1 outline-white/10 *:bg-gray-800 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6'
                >
                  <option>United States</option>
                  <option>Canada</option>
                  <option>Mexico</option>
                </select>
                <ChevronDownIcon
                  aria-hidden='true'
                  className='pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-400 sm:size-4'
                />
              </div>
            </div>

            <div className='col-span-full'>
              <label
                htmlFor='street-address'
                className='block text-sm/6 font-medium text-white'
              >
                Street address
              </label>
              <div className='mt-2'>
                <input
                  id='street-address'
                  name='street-address'
                  type='text'
                  autoComplete='street-address'
                  className='block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6'
                />
              </div>
            </div>

            <div className='sm:col-span-2 sm:col-start-1'>
              <label
                htmlFor='city'
                className='block text-sm/6 font-medium text-white'
              >
                City
              </label>
              <div className='mt-2'>
                <input
                  id='city'
                  name='city'
                  type='text'
                  autoComplete='address-level2'
                  className='block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6'
                />
              </div>
            </div>

            <div className='sm:col-span-2'>
              <label
                htmlFor='region'
                className='block text-sm/6 font-medium text-white'
              >
                State / Province
              </label>
              <div className='mt-2'>
                <input
                  id='region'
                  name='region'
                  type='text'
                  autoComplete='address-level1'
                  className='block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6'
                />
              </div>
            </div>

            <div className='sm:col-span-2'>
              <label
                htmlFor='postal-code'
                className='block text-sm/6 font-medium text-white'
              >
                ZIP / Postal code
              </label>
              <div className='mt-2'>
                <input
                  id='postal-code'
                  name='postal-code'
                  type='text'
                  autoComplete='postal-code'
                  className='block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6'
                />
              </div>
            </div>
          </div>
        </div>

        <div className='border-b border-white/10 pb-12'>
          <h2 className='text-base/7 font-semibold text-white'>
            Notifications
          </h2>
          <p className='mt-1 text-sm/6 text-gray-400'>
            We&#39;ll always let you know about important changes, but you pick
            what else you want to hear about.
          </p>

          <div className='mt-10 space-y-10'>
            <fieldset>
              <legend className='text-sm/6 font-semibold text-white'>
                By email
              </legend>
              <div className='mt-6 space-y-6'>
                <div className='flex gap-3'>
                  <div className='flex h-6 shrink-0 items-center'>
                    <div className='group grid size-4 grid-cols-1'>
                      <input
                        defaultChecked
                        id='comments'
                        name='comments'
                        type='checkbox'
                        aria-describedby='comments-description'
                        className='col-start-1 row-start-1 appearance-none rounded-sm border border-white/10 bg-white/5 checked:border-indigo-500 checked:bg-indigo-500 indeterminate:border-indigo-500 indeterminate:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-white/5 disabled:bg-white/10 disabled:checked:bg-white/10 forced-colors:appearance-auto'
                      />
                      <svg
                        fill='none'
                        viewBox='0 0 14 14'
                        className='pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-white/25'
                      >
                        <path
                          d='M3 8L6 11L11 3.5'
                          strokeWidth={2}
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          className='opacity-0 group-has-checked:opacity-100'
                        />
                        <path
                          d='M3 7H11'
                          strokeWidth={2}
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          className='opacity-0 group-has-indeterminate:opacity-100'
                        />
                      </svg>
                    </div>
                  </div>
                  <div className='text-sm/6'>
                    <label
                      htmlFor='comments'
                      className='font-medium text-white'
                    >
                      Comments
                    </label>
                    <p id='comments-description' className='text-gray-400'>
                      Get notified when someones posts a comment on a posting.
                    </p>
                  </div>
                </div>
                <div className='flex gap-3'>
                  <div className='flex h-6 shrink-0 items-center'>
                    <div className='group grid size-4 grid-cols-1'>
                      <input
                        id='candidates'
                        name='candidates'
                        type='checkbox'
                        aria-describedby='candidates-description'
                        className='col-start-1 row-start-1 appearance-none rounded-sm border border-white/10 bg-white/5 checked:border-indigo-500 checked:bg-indigo-500 indeterminate:border-indigo-500 indeterminate:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-white/5 disabled:bg-white/10 disabled:checked:bg-white/10 forced-colors:appearance-auto'
                      />
                      <svg
                        fill='none'
                        viewBox='0 0 14 14'
                        className='pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-white/25'
                      >
                        <path
                          d='M3 8L6 11L11 3.5'
                          strokeWidth={2}
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          className='opacity-0 group-has-checked:opacity-100'
                        />
                        <path
                          d='M3 7H11'
                          strokeWidth={2}
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          className='opacity-0 group-has-indeterminate:opacity-100'
                        />
                      </svg>
                    </div>
                  </div>
                  <div className='text-sm/6'>
                    <label
                      htmlFor='candidates'
                      className='font-medium text-white'
                    >
                      Candidates
                    </label>
                    <p id='candidates-description' className='text-gray-400'>
                      Get notified when a candidate applies for a job.
                    </p>
                  </div>
                </div>
                <div className='flex gap-3'>
                  <div className='flex h-6 shrink-0 items-center'>
                    <div className='group grid size-4 grid-cols-1'>
                      <input
                        id='offers'
                        name='offers'
                        type='checkbox'
                        aria-describedby='offers-description'
                        className='col-start-1 row-start-1 appearance-none rounded-sm border border-white/10 bg-white/5 checked:border-indigo-500 checked:bg-indigo-500 indeterminate:border-indigo-500 indeterminate:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-white/5 disabled:bg-white/10 disabled:checked:bg-white/10 forced-colors:appearance-auto'
                      />
                      <svg
                        fill='none'
                        viewBox='0 0 14 14'
                        className='pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-white/25'
                      >
                        <path
                          d='M3 8L6 11L11 3.5'
                          strokeWidth={2}
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          className='opacity-0 group-has-checked:opacity-100'
                        />
                        <path
                          d='M3 7H11'
                          strokeWidth={2}
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          className='opacity-0 group-has-indeterminate:opacity-100'
                        />
                      </svg>
                    </div>
                  </div>
                  <div className='text-sm/6'>
                    <label htmlFor='offers' className='font-medium text-white'>
                      Offers
                    </label>
                    <p id='offers-description' className='text-gray-400'>
                      Get notified when a candidate accepts or rejects an offer.
                    </p>
                  </div>
                </div>
              </div>
            </fieldset>

            {/* <fieldset>
              <legend className='text-sm/6 font-semibold text-white'>
                Push notifications
              </legend>
              <p className='mt-1 text-sm/6 text-gray-400'>
                These are delivered via SMS to your mobile phone.
              </p>
              <div className='mt-6 space-y-6'>
                <div className='flex items-center gap-x-3'>
                  <input
                    defaultChecked
                    id='push-everything'
                    name='push-notifications'
                    type='radio'
                    className='relative size-4 appearance-none rounded-full border border-white/10 bg-white/5 before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-500 checked:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-white/5 disabled:bg-white/10 disabled:before:bg-white/20 forced-colors:appearance-auto forced-colors:before:hidden'
                  />
                  <label
                    htmlFor='push-everything'
                    className='block text-sm/6 font-medium text-white'
                  >
                    Everything
                  </label>
                </div>
                <div className='flex items-center gap-x-3'>
                  <input
                    id='push-email'
                    name='push-notifications'
                    type='radio'
                    className='relative size-4 appearance-none rounded-full border border-white/10 bg-white/5 before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-500 checked:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-white/5 disabled:bg-white/10 disabled:before:bg-white/20 forced-colors:appearance-auto forced-colors:before:hidden'
                  />
                  <label
                    htmlFor='push-email'
                    className='block text-sm/6 font-medium text-white'
                  >
                    Same as email
                  </label>
                </div>
                <div className='flex items-center gap-x-3'>
                  <input
                    id='push-nothing'
                    name='push-notifications'
                    type='radio'
                    className='relative size-4 appearance-none rounded-full border border-white/10 bg-white/5 before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-500 checked:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-white/5 disabled:bg-white/10 disabled:before:bg-white/20 forced-colors:appearance-auto forced-colors:before:hidden'
                  />
                  <label
                    htmlFor='push-nothing'
                    className='block text-sm/6 font-medium text-white'
                  >
                    No push notifications
                  </label>
                </div>
              </div>
            </fieldset> */}
          </div>
        </div>
      </div>

      <div className='mt-6 flex items-center justify-end gap-x-6'>
        <button type='button' className='text-sm/6 font-semibold text-white'>
          Cancel
        </button>
        <button
          type='submit'
          className='rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500'
        >
          Save
        </button>
      </div>
    </form>
  );
}
