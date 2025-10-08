import { useAuth } from '@/contexts/useAuth';
import { Avatar } from '../catalyst-ui-kit/avatar';
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from '../catalyst-ui-kit/dropdown';
import { NavbarItem } from '../catalyst-ui-kit/navbar';
import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  Cog8ToothIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@heroicons/react/20/solid';
import { useNavigate } from 'react-router';

function UserMenu() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  return (
    <Dropdown>
      <DropdownButton as={NavbarItem}>
        {profile?.avatar ? (
          <Avatar src={profile?.avatar} square />
        ) : (
          <UserIcon />
        )}
        <span className='hidden lg:inline'>{profile?.username}</span>
        <ChevronDownIcon className='hidden lg:inline' />
      </DropdownButton>
      <DropdownMenu className='min-w-64' anchor='bottom end'>
        {/* <DropdownItem href='/my-profile'>
          <UserIcon />
          <DropdownLabel>My profile</DropdownLabel>
        </DropdownItem> */}
        <DropdownItem href='/account/settings'>
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
  );
}

export default UserMenu;
