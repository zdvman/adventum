import { NavbarItem, NavbarSection } from '../catalyst-ui-kit/navbar';

function HorisontalMainMenu({ navigation }) {
  return (
    <NavbarSection className='max-lg:hidden'>
      {navigation.map((item) => (
        <NavbarItem key={item.href} href={item.href}>
          {item.name}
        </NavbarItem>
      ))}
    </NavbarSection>
  );
}

export default HorisontalMainMenu;
