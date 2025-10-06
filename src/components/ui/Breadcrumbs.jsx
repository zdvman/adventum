// @components/ui/Breadcrumbs.jsx
import { useEffect, useMemo, useState } from 'react';
import { HomeIcon } from '@heroicons/react/20/solid';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { splitIdSlug } from '@/utils/slug';

const LABELS = {
  events: 'Events',
  new: 'Create Event',
  edit: 'Edit',
  auth: 'Auth',
  'sign-in': 'Sign In',
  'sign-up': 'Sign Up',
  reset: 'Reset Password',
};

function titleize(str) {
  return decodeURIComponent(str)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Breadcrumbs (no conditional hooks)
 * - Always calls hooks at the top
 * - Uses effect logic to optionally fetch event title for /events/:id-:slug
 */
export default function Breadcrumbs({ className, hideOnHome = true }) {
  const location = useLocation();

  // compute segments every render (no conditions)
  const segments = useMemo(
    () => location.pathname.split('/').filter(Boolean),
    [location.pathname]
  );

  // resolve event title if last crumb is /events/:id-:slug
  const [eventTitle, setEventTitle] = useState('');
  useEffect(() => {
    let ignore = false;

    async function resolve() {
      // default empty
      let next = '';

      // If it's exactly /events/:id-:slug (second segment exists), fetch the event
      if (segments.length >= 2 && segments[0] === 'events') {
        const { id } = splitIdSlug(segments[1]);
        if (id) {
          try {
            const snap = await getDoc(doc(db, 'events', id));
            if (!ignore && snap.exists()) {
              next = snap.data()?.title || '';
            }
          } catch {
            /* ignore */
          }
        }
      }

      if (!ignore) setEventTitle(next);
    }

    resolve();
    return () => {
      ignore = true;
    };
  }, [segments]);

  // optionally hide on home (do not conditionally call hooks above)
  if (hideOnHome && location.pathname === '/') return null;

  // build crumbs (current is the last)
  const crumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const isCurrent = index === segments.length - 1;

    // If current is /events/:id-:slug, prefer fetched event title
    let name =
      LABELS[segment] ??
      (isCurrent && segments[0] === 'events' && segments.length >= 2
        ? eventTitle || titleize(segment)
        : titleize(segment));

    return { name, href, current: isCurrent };
  });

  return (
    <nav aria-label='Breadcrumb' className={clsx('hidden md:flex', className)}>
      <ol role='list' className='flex items-center space-x-4'>
        <li>
          <div>
            <Link to='/' className='text-gray-400 hover:text-gray-300'>
              <HomeIcon aria-hidden='true' className='size-5 shrink-0' />
              <span className='sr-only'>Home</span>
            </Link>
          </div>
        </li>

        {crumbs.map((page) => (
          <li key={page.href}>
            <div className='flex items-center'>
              {/* diagonal divider */}
              <svg
                fill='currentColor'
                viewBox='0 0 20 20'
                aria-hidden='true'
                className='size-5 shrink-0 text-gray-600'
              >
                <path d='M5.555 17.776l8-16 .894.448-8 16-.894-.448z' />
              </svg>

              {page.current ? (
                <span className='ml-4 text-sm font-medium text-gray-200'>
                  {page.name}
                </span>
              ) : (
                <Link
                  to={page.href}
                  aria-current={page.current ? 'page' : undefined}
                  className='ml-4 text-sm font-medium text-gray-400 hover:text-gray-200'
                >
                  {page.name}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
