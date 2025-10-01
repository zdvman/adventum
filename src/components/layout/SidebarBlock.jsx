import { Sidebar, SidebarHeader } from '@/components/catalyst-ui-kit/sidebar';
import { useAuth } from '@/contexts/useAuth';
import StaffDropdownMenu from '../ui/StaffDropdownMenu';
import MainMenu from '@/components/ui/MainMenu';
import SearchBar from '@/components/ui/SearchBar';

function SidebarBlock({ mainMenuNavItems }) {
  const { profile } = useAuth();
  return (
    <Sidebar>
      <SidebarHeader>
        {profile?.role === 'staff' && (
          <StaffDropdownMenu className='lg:mb-2.5' />
        )}
      </SidebarHeader>
      <SearchBar className='px-2.5 mt-3 mb-3' />
      <MainMenu navItems={mainMenuNavItems} variant='sidebar' />
    </Sidebar>
  );
}

export default SidebarBlock;
