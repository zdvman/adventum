import { Avatar } from '@/components/catalyst-ui-kit/avatar';
import {
  Dropdown,
  DropdownButton,
} from '@/components/catalyst-ui-kit/dropdown';

import {
  Sidebar,
  SidebarHeader,
  SidebarItem,
  SidebarLabel,
} from '@/components/catalyst-ui-kit/sidebar';
import { ChevronDownIcon } from '@heroicons/react/16/solid';
import SidebarMainMenu from '../ui/SidebarMainMenu';

function SidebarBlock({ mainMenuNavItems }) {
  return (
    <Sidebar>
      <SidebarHeader>
        <Dropdown>
          <DropdownButton as={SidebarItem} className='lg:mb-2.5'>
            <Avatar src='/tailwind-logo.svg' />
            <SidebarLabel>Tailwind Labs</SidebarLabel>
            <ChevronDownIcon />
          </DropdownButton>
        </Dropdown>
      </SidebarHeader>
      <SidebarMainMenu navItems={mainMenuNavItems} />
    </Sidebar>
  );
}

export default SidebarBlock;
