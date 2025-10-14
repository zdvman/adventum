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
  CheckIcon,
  ChevronDownIcon,
  Cog8ToothIcon,
  MapIcon,
  PlusIcon,
  ShieldCheckIcon,
  TableCellsIcon,
  TagIcon,
  UsersIcon,
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
        {/* <DropdownItem href='/teams/1/settings'>
          <Cog8ToothIcon />
          <DropdownLabel>Settings</DropdownLabel>
        </DropdownItem>
        <DropdownDivider /> */}
        <DropdownItem href='/staff/users'>
          <UsersIcon />
          <DropdownLabel>Users</DropdownLabel>
        </DropdownItem>
        <DropdownItem href='/staff/events'>
          <TableCellsIcon />
          <DropdownLabel>Events</DropdownLabel>
        </DropdownItem>
        <DropdownItem href='/staff/venues'>
          <MapIcon />
          <DropdownLabel>Venues</DropdownLabel>
        </DropdownItem>
        <DropdownItem href='/staff/categories'>
          <TagIcon />
          <DropdownLabel>Categories</DropdownLabel>
        </DropdownItem>
        {/* <DropdownDivider />
        <DropdownItem href='/teams/create'>
          <PlusIcon />
          <DropdownLabel>New team&hellip;</DropdownLabel>
        </DropdownItem> */}
      </DropdownMenu>
    </Dropdown>
  );
}
