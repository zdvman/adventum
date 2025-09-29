import { NavLink } from 'react-router';

function Logo({
  children,
  to = '/',
  logoSrc = 'https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500',
}) {
  return (
    <div className='flex lg:flex-1'>
      <NavLink to={to} className='-m-1.5 p-1.5'>
        <span className='sr-only'>Adventum</span>
        <img alt='Adventum Logo' src={logoSrc} className='h-8 w-auto' />
      </NavLink>
      {children}
    </div>
  );
}

export default Logo;
