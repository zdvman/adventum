// src/components/ui/StaffDropdownMenu.jsx
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from '@/components/catalyst-ui-kit/dropdown';
import { Avatar } from '@/components/catalyst-ui-kit/avatar';
import {
  ChevronDownIcon,
  Cog8ToothIcon,
  PlusIcon,
  ShieldCheckIcon,
} from '@heroicons/react/20/solid';
import { SidebarItem, SidebarLabel } from '../catalyst-ui-kit/sidebar';

export default function StaffDropdownMenu({ className }) {
  return (
    <Dropdown>
      <DropdownButton as={SidebarItem} className={className}>
        <ShieldCheckIcon />
        {/* <Avatar src='/tailwind-logo.svg' /> */}
        <SidebarLabel>Staff Area</SidebarLabel>
        <ChevronDownIcon />
      </DropdownButton>
      <DropdownMenu className='min-w-80 lg:min-w-64' anchor='bottom start'>
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
