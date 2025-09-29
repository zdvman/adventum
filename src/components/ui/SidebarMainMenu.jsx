import {
  SidebarBody,
  SidebarItem,
  SidebarSection,
} from '../catalyst-ui-kit/sidebar';

function SidebarMainMenu({ navItems }) {
  return (
    <SidebarBody>
      <SidebarSection>
        {navItems.map(({ label, url }) => (
          <SidebarItem key={label} href={url}>
            {label}
          </SidebarItem>
        ))}
      </SidebarSection>
    </SidebarBody>
  );
}

export default SidebarMainMenu;
