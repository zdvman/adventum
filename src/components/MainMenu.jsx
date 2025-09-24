import { Avatar } from '@/components/catalyst-ui-kit/avatar';
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from '@/components/catalyst-ui-kit/dropdown';
import {
  Navbar,
  NavbarDivider,
  NavbarItem,
  NavbarLabel,
  NavbarSection,
  NavbarSpacer,
} from '@/components/catalyst-ui-kit/navbar';
import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  Cog8ToothIcon,
  LightBulbIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@heroicons/react/16/solid';
import { InboxIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';

function MainMenu() {
  return (
    <Navbar>
      <Dropdown>
        <DropdownButton as={NavbarItem}>
          <Avatar src='/tailwind-logo.svg' />
          <NavbarLabel>Tailwind Labs</NavbarLabel>
          <ChevronDownIcon />
        </DropdownButton>
        <DropdownMenu className='min-w-64' anchor='bottom start'>
          <DropdownItem href='/teams/1/settings'>
            <Cog8ToothIcon />
            <DropdownLabel>Settings</DropdownLabel>
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem href='/teams/1'>
            <Avatar slot='icon' src='/tailwind-logo.svg' />
            <DropdownLabel>Tailwind Labs</DropdownLabel>
          </DropdownItem>
          <DropdownItem href='/teams/2'>
            <Avatar
              slot='icon'
              initials='WC'
              className='bg-purple-500 text-white'
            />
            <DropdownLabel>Workcation</DropdownLabel>
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem href='/teams/create'>
            <PlusIcon />
            <DropdownLabel>New team&hellip;</DropdownLabel>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <NavbarDivider className='max-lg:hidden' />
      <NavbarSection className='max-lg:hidden'>
        <NavbarItem href='/' current>
          Home
        </NavbarItem>
        <NavbarItem href='/events'>Events</NavbarItem>
        <NavbarItem href='/orders'>Orders</NavbarItem>
      </NavbarSection>
      <NavbarSpacer />
      <NavbarSection>
        <NavbarItem href='/search' aria-label='Search'>
          <MagnifyingGlassIcon />
        </NavbarItem>
        <NavbarItem href='/inbox' aria-label='Inbox'>
          <InboxIcon />
        </NavbarItem>
        <Dropdown>
          <DropdownButton as={NavbarItem}>
            <Avatar src='/profile-photo.jpg' square />
          </DropdownButton>
          <DropdownMenu className='min-w-64' anchor='bottom end'>
            <DropdownItem href='/my-profile'>
              <UserIcon />
              <DropdownLabel>My profile</DropdownLabel>
            </DropdownItem>
            <DropdownItem href='/settings'>
              <Cog8ToothIcon />
              <DropdownLabel>Settings</DropdownLabel>
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem href='/privacy-policy'>
              <ShieldCheckIcon />
              <DropdownLabel>Privacy policy</DropdownLabel>
            </DropdownItem>
            <DropdownItem href='/share-feedback'>
              <LightBulbIcon />
              <DropdownLabel>Share feedback</DropdownLabel>
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem href='/logout'>
              <ArrowRightStartOnRectangleIcon />
              <DropdownLabel>Sign out</DropdownLabel>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavbarSection>
    </Navbar>
  );
}

/* 'use client';

import { useState } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { NavLink } from 'react-router';

const navigation = [
  { name: 'Product', href: '#' },
  { name: 'Features', href: '#' },
  { name: 'Marketplace', href: '#' },
  { name: 'Company', href: '#' },
];

function MainMenu({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className='bg-gray-900'>
      <nav
        aria-label='Global'
        className='mx-auto flex max-w-7xl items-center justify-between gap-x-6 p-6 lg:px-8'
      >
        {children}
        <div className='hidden lg:flex lg:gap-x-12'>
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className='text-sm/6 font-semibold text-white'
            >
              {item.name}
            </a>
          ))}
        </div>
        <div className='flex flex-1 items-center justify-end gap-x-6'>
          <NavLink
            to='/auth'
            className='hidden text-sm/6 font-semibold text-white lg:block'
          >
            Log in
          </NavLink>
          <NavLink
            to='/auth'
            className='rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500'
          >
            Sign up
          </NavLink>
        </div>
        <div className='flex lg:hidden'>
          <button
            type='button'
            onClick={() => setMobileMenuOpen(true)}
            className='-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-400'
          >
            <span className='sr-only'>Open main menu</span>
            <Bars3Icon aria-hidden='true' className='size-6' />
          </button>
        </div>
      </nav>
      <Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className='lg:hidden'
      >
        <div className='fixed inset-0 z-50' />
        <DialogPanel className='fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-gray-900 p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-100/10'>
          <div className='flex items-center gap-x-6'>
            <a href='#' className='-m-1.5 p-1.5'>
              <span className='sr-only'>Your Company</span>
              <img
                alt=''
                src='https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500'
                className='h-8 w-auto'
              />
            </a>
            <NavLink
              to='/auth'
              className='ml-auto rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500'
            >
              Sign up
            </NavLink>
            <button
              type='button'
              onClick={() => setMobileMenuOpen(false)}
              className='-m-2.5 rounded-md p-2.5 text-gray-400'
            >
              <span className='sr-only'>Close menu</span>
              <XMarkIcon aria-hidden='true' className='size-6' />
            </button>
          </div>
          <div className='mt-6 flow-root'>
            <div className='-my-6 divide-y divide-white/10'>
              <div className='space-y-2 py-6'>
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className='-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white hover:bg-white/5'
                  >
                    {item.name}
                  </a>
                ))}
              </div>
              <div className='py-6'>
                <NavLink
                  to='/auth'
                  className='-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-white hover:bg-white/5'
                >
                  Log in
                </NavLink>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
}

*/
export default MainMenu;
