import { NavLink } from 'react-router';

function Logo({ children, logoSrc }) {
  return (
    <div className='flex lg:flex-1'>
      <NavLink to='/' className='-m-1.5 p-1.5'>
        <span className='sr-only'>Adventum</span>
        <img
          alt=''
          // src='https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500'
          src={logoSrc}
          className='h-8 w-auto'
        />
      </NavLink>
      {children}
    </div>
  );
}

export default Logo;
