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
import {
  InboxIcon,
  MagnifyingGlassIcon,
  WrenchIcon,
  ArrowRightCircleIcon,
  ArrowRightEndOnRectangleIcon,
  ArrowRightIcon,
} from '@heroicons/react/20/solid';

import StaffDropdownMenu from '@/components/ui/StaffDropdownMenu';
import Logo from '../ui/Logo';
import HorisontalMainMenu from '../ui/HorisontalMainMenu';
import { useAuth } from '@/contexts/useAuth';
import { useNavigate } from 'react-router';

const mainMenuNavigation = [
  { name: 'Home', href: '/' },
  { name: 'Events', href: '/events' },
  { name: 'Orders', href: '/orders' },
];

export default function Header() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  return (
    <Navbar>
      {profile?.role === 'staff' && (
        <>
          <StaffDropdownMenu />
          <NavbarDivider className='max-lg:hidden' />
        </>
      )}
      <HorisontalMainMenu navigation={mainMenuNavigation} />
      <NavbarSpacer />
      <Logo />
      <NavbarSpacer />
      <NavbarSection>
        {/* <NavbarItem href='/search' aria-label='Search'>
            <MagnifyingGlassIcon />
          </NavbarItem>
          <NavbarItem href='/inbox' aria-label='Inbox'>
            <InboxIcon />
          </NavbarItem> */}
        {!profile ? (
          <NavbarItem href='/auth' aria-label='Inbox'>
            Sign in
            <ArrowRightEndOnRectangleIcon />
          </NavbarItem>
        ) : (
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
              <DropdownItem as='button' onClick={handleSignOut}>
                <ArrowRightStartOnRectangleIcon />
                <DropdownLabel>Sign out</DropdownLabel>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )}
      </NavbarSection>
    </Navbar>
  );
}
