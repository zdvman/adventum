import {
  ChevronDownIcon,
  Cog8ToothIcon,
  WrenchIcon,
  PlusIcon,
} from '@heroicons/react/20/solid';
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from '../catalyst-ui-kit/dropdown';
import { NavbarItem, NavbarLabel } from '../catalyst-ui-kit/navbar';
import { Avatar } from '../catalyst-ui-kit/avatar';

function StaffDropdownMenu() {
  return (
    <Dropdown>
      <DropdownButton as={NavbarItem}>
        <WrenchIcon />
        {/* <Avatar src='/tailwind-logo.svg' /> */}
        <NavbarLabel>Staff Area</NavbarLabel>
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
  );
}

export default StaffDropdownMenu;
