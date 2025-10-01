// src/components/ui/Logo.jsx
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

function Logo({
  className,
  children,
  to = '/',
  logoSrc = 'https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500',
}) {
  return (
    <div
      className={clsx(
        // center on mobile, left on desktop
        'flex w-full items-center justify-center lg:w-auto lg:justify-start',
        className
      )}
    >
      <NavLink to={to} className='-m-1.5 inline-flex p-1.5'>
        <span className='sr-only'>Adventum</span>
        <img alt='Adventum Logo' src={logoSrc} className='h-8 w-auto' />
      </NavLink>
      {children}
    </div>
  );
}

export default Logo;
