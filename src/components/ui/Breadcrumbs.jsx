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
  checkout: 'Checkout', // ← added
  new: 'Create Event',
  edit: 'Edit',
  auth: 'Auth',
  'sign-in': 'Sign In',
  'sign-up': 'Sign Up',
  reset: 'Reset Password',
};

function wordsTitleCase(str) {
  return decodeURIComponent(str)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function slugOnlyTitle(idSlug) {
  const { slug } = splitIdSlug(idSlug);
  return wordsTitleCase(slug || idSlug);
}

/**
 * Breadcrumbs
 * - Understands /events/:idSlug and /checkout/:idSlug
 * - For those, fetches the event title by ID and uses it for the leaf crumb.
 * - Otherwise prettifies path segments (kebab → Title Case).
 * - Doesn't link "Checkout" because there is no /checkout index page.
 */
export default function Breadcrumbs({ className, hideOnHome = true }) {
  const location = useLocation();

  const segments = useMemo(
    () => location.pathname.split('/').filter(Boolean),
    [location.pathname]
  );

  // Fetch event title for routes that carry an event idSlug
  const [eventTitle, setEventTitle] = useState('');
  useEffect(() => {
    let ignore = false;

    async function resolveEventTitle() {
      setEventTitle('');
      if (
        segments.length >= 2 &&
        (segments[0] === 'events' || segments[0] === 'checkout')
      ) {
        const { id } = splitIdSlug(segments[1]);
        if (id) {
          try {
            const snap = await getDoc(doc(db, 'events', id));
            if (!ignore && snap.exists()) {
              setEventTitle(snap.data()?.title || '');
            }
          } catch {
            // ignore
          }
        }
      }
    }

    resolveEventTitle();
    return () => {
      ignore = true;
    };
  }, [segments]);

  if (hideOnHome && location.pathname === '/') return null;

  const crumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const isCurrent = index === segments.length - 1;

    // If we’re in /events/:idSlug or /checkout/:idSlug
    const isEventish =
      (segments[0] === 'events' || segments[0] === 'checkout') && index === 1;

    let name;
    if (LABELS[segment]) {
      name = LABELS[segment];
    } else if (isEventish) {
      // Prefer fetched title; otherwise, show a prettified slug (no UID).
      name = eventTitle || slugOnlyTitle(segments[1]);
    } else {
      name = wordsTitleCase(segment);
    }

    // Don't link "Checkout" because there is no index page there.
    const isLinkableRootCheckout = segments[0] === 'checkout' && index === 0;
    const linkable = !isCurrent && !isLinkableRootCheckout;

    return { name, href, current: isCurrent, linkable };
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
              <svg
                fill='currentColor'
                viewBox='0 0 20 20'
                aria-hidden='true'
                className='size-5 shrink-0 text-gray-600'
              >
                <path d='M5.555 17.776l8-16 .894.448-8 16-.894-.448z' />
              </svg>

              {page.linkable ? (
                <Link
                  to={page.href}
                  className='ml-4 text-sm font-medium text-gray-400 hover:text-gray-200'
                >
                  {page.name}
                </Link>
              ) : (
                <span
                  className={clsx(
                    'ml-4 text-sm font-medium',
                    page.current ? 'text-gray-200' : 'text-gray-400'
                  )}
                >
                  {page.name}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
