import { Button } from '@/components/catalyst-ui-kit/button';
import { NavLink } from 'react-router';

function NotFound() {
  return (
    <>
      <main className='grid min-h-full place-items-center bg-gray-900 px-6 py-24 sm:py-32 lg:px-8'>
        <div className='text-center'>
          <p className='text-base font-semibold text-indigo-400'>404</p>
          <h1 className='mt-4 text-5xl font-semibold tracking-tight text-balance text-white sm:text-7xl'>
            Page not found
          </h1>
          <p className='mt-6 text-lg font-medium text-pretty text-gray-400 sm:text-xl/8'>
            Sorry, we couldn’t find the page you’re looking for.
          </p>
          <div className='mt-10 flex items-center justify-center gap-x-6'>
            <Button>
              <NavLink to='/'>Go back home</NavLink>
            </Button>
            <NavLink to='/support' className='text-sm font-semibold text-white'>
              Contact support <span aria-hidden='true'>&rarr;</span>
            </NavLink>
          </div>
        </div>
      </main>
    </>
  );
}

export default NotFound;
