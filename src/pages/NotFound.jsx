import { Button } from '@/components/catalyst-ui-kit/button';

function NotFound({
  header = 'Page not found',
  message = 'Sorry, we couldn’t find the page you’re looking for.',
  error = '404',
}) {
  return (
    <>
      <main className='grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8'>
        <div className='text-center'>
          <p className='text-base font-semibold text-white'>{error}</p>
          <h1 className='mt-4 text-5xl font-semibold tracking-tight text-balance text-white sm:text-7xl'>
            {header}
          </h1>
          <p className='mt-6 text-lg font-medium text-pretty text-gray-400 sm:text-xl/8'>
            {message}
          </p>
          <div className='mt-10 flex items-center justify-center gap-x-6'>
            <Button href='/' className='w-full'>
              Go back home
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}

export default NotFound;
