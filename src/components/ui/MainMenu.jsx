// src/components/ui/MainMenu.jsx
import { NavbarSection, NavbarItem } from '@/components/catalyst-ui-kit/navbar';
import {
  SidebarBody,
  SidebarSection,
  SidebarItem,
} from '@/components/catalyst-ui-kit/sidebar';

/**
 * Props:
 * - navItems: [{ label, url, exclude? }]
 * - variant: 'navbar' | 'sidebar'
 * - className?: string
 */
export default function MainMenu({ navItems, variant = 'navbar', className }) {
  if (variant === 'sidebar') {
    return (
      <SidebarBody className={className}>
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

  // default: navbar
  return (
    <NavbarSection className={className}>
      {navItems.map(({ label, url, exclude }) => (
        <NavbarItem key={label} href={url} exclude={exclude}>
          {label}
        </NavbarItem>
      ))}
    </NavbarSection>
  );
}
