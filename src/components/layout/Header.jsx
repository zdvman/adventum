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
  ChevronDownIcon,
  Cog8ToothIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@heroicons/react/16/solid';
import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/20/solid';

import StaffDropdownMenu from '@/components/ui/StaffDropdownMenu';
import { useAuth } from '@/contexts/useAuth';
import Logo from '@/components/ui/Logo';
import SearchBar from '@/components/ui/SearchBar';
import MainMenu from '../ui/MainMenu';
import UserMenu from '../ui/UserMenu';

export default function Header({ mainMenuNavItems }) {
  const { profile } = useAuth();

  return (
    <Navbar>
      <Logo />
      {profile?.role === 'staff' && (
        <StaffDropdownMenu className='max-lg:hidden' />
      )}
      <SearchBar className='hidden lg:block w-full max-w-md' />
      <MainMenu
        navItems={mainMenuNavItems}
        variant='navbar'
        className='max-lg:hidden'
      />
      <NavbarSpacer />
      <NavbarSection>
        {!profile ? (
          <NavbarItem href='/auth/sign-in' aria-label='Sign in'>
            <span className='hidden lg:inline'>Sign in</span>
            <ArrowRightEndOnRectangleIcon className='lg:hidden size-5' />
          </NavbarItem>
        ) : (
          <UserMenu />
        )}
      </NavbarSection>
    </Navbar>
  );
}
