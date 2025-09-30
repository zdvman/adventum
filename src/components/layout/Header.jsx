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
  NavbarSection,
  NavbarSpacer,
} from '@/components/catalyst-ui-kit/navbar';
import {
  ArrowRightStartOnRectangleIcon,
  Cog8ToothIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@heroicons/react/16/solid';
import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/20/solid';

import StaffDropdownMenu from '@/components/ui/StaffDropdownMenu';
import { useAuth } from '@/contexts/useAuth';
import { useNavigate } from 'react-router';
import HorizontalMainMenu from '@/components/ui/HorizontalMainMenu';
import Logo from '@/components/ui/Logo';
import SearchBar from '@/components/ui/SearchBar';

export default function Header({ mainMenuNavItems }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  return (
    <>
      <Logo />
      <Navbar>
        {profile?.role === 'staff' && (
          <>
            <StaffDropdownMenu />
            {/* <NavbarDivider className='max-lg:hidden' /> */}
          </>
        )}
        <SearchBar />
        <HorizontalMainMenu navItems={mainMenuNavItems} />
        <NavbarSpacer />
        <NavbarSection>
          {!profile ? (
            <NavbarItem href='/auth/sign-in' aria-label='Auth SignIn'>
              Sign in
              <ArrowRightEndOnRectangleIcon />
            </NavbarItem>
          ) : (
            <Dropdown>
              <DropdownButton as={NavbarItem}>
                <Avatar src={profile?.avatar} square />
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
    </>
  );
}
