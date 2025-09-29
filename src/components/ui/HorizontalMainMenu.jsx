import { NavbarItem, NavbarSection } from '../catalyst-ui-kit/navbar';

function HorizontalMainMenu({ navItems }) {
  return (
    <NavbarSection className='max-lg:hidden'>
      {navItems.map((item) => (
        <NavbarItem key={item.label} href={item.url}>
          {item.name}
        </NavbarItem>
      ))}
    </NavbarSection>
  );
}

export default HorizontalMainMenu;
