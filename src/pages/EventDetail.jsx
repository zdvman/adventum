// src/pages/EventDetail.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, getDocFromServer } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/contexts/useAuth';

import { composeIdSlug, splitIdSlug } from '@/utils/slug';
import {
  ticketsRemaining,
  anyTicketTypeAvailable,
  isOnSale,
  formatMoney,
  cheapestAvailableTicket,
} from '@/utils/eventHelpers';

// Catalyst UI
import { Heading } from '@/components/catalyst-ui-kit/heading';
import { Button } from '@/components/catalyst-ui-kit/button';
import { Badge } from '@/components/catalyst-ui-kit/badge';
import { Link } from '@/components/catalyst-ui-kit/link';
import { Strong, Text } from '@/components/catalyst-ui-kit/text';

// Icons
import {
  CalendarDaysIcon,
  MapPinIcon,
  ShareIcon,
  TicketIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

// Shared
import Loading from '@/components/ui/Loading';
import { formatDateRangeLabel } from '@/utils/formatTimeStamp.js';
import NotFound from './NotFound';

export default function EventDetail() {
  const { user, profile, initializing, setError } = useAuth();
  const navigate = useNavigate();
  const { idSlug = '' } = useParams();
  const { id } = useMemo(() => splitIdSlug(idSlug), [idSlug]);

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [venue, setVenue] = useState(null);

  // guard result: 'ok' | 'forbidden' | 'notfound'
  const [guard, setGuard] = useState('ok');

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setGuard('ok');

      try {
        if (!id) {
          if (!ignore) setGuard('notfound');
          return;
        }

        // Force a server read to respect latest rules (avoid stale cache)
        let evSnap;
        try {
          evSnap = await getDocFromServer(doc(db, 'events', id));
        } catch (e) {
          // Permission denied → event exists but you can't read it
          if (!ignore) setGuard('forbidden');
          throw e;
        }

        if (!evSnap.exists()) {
          if (!ignore) setGuard('notfound');
          return;
        }
        const ev = { id: evSnap.id, ...evSnap.data() };

        // Optional venue (this read is public per your rules)
        let v = null;
        if (ev.venueId) {
          // venue read is always public; getDoc (server or cache is fine)
          const vSnap = await getDoc(doc(db, 'venues', ev.venueId));
          if (vSnap.exists()) v = { id: vSnap.id, ...vSnap.data() };
        }
        if (ignore) return;

        // Canonicalize URL if title changed
        const canonical = `/events/${composeIdSlug(ev.id, ev.title)}`;
        if (location.pathname !== canonical) {
          navigate(canonical, { replace: true });
        }

        // Runtime guard (belt-and-suspenders on top of rules)
        const isStaff = profile?.role === 'staff';
        const isOwner = user && ev.createdBy === user.uid;
        const isPublicApproved =
          ev.publishStatus === 'published' &&
          ev.moderationStatus === 'approved';

        if (!(isStaff || isOwner || isPublicApproved)) {
          setGuard('forbidden');
          return;
        }

        setEvent(ev);
        setVenue(v);
      } catch (e) {
        // Log but don't overwrite explicit guard decisions above
        console.error('EventDetail load error:', e);
        setError?.(e?.message || 'Failed to load event');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    // Wait until we know who the user is before deciding owner/staff/public
    if (!initializing) {
      load();
    }
    return () => {
      ignore = true;
    };
  }, [id, navigate, setError, initializing, user?.uid, profile?.role]);

  // While auth bootstraps OR fetching the doc
  if (initializing || loading) return <Loading />;

  if (guard === 'notfound') {
    return (
      <NotFound
        header='Page not found'
        message='Sorry, we couldn’t find the event you’re looking for.'
        error='404'
      />
    );
  }

  if (guard === 'forbidden') {
    return (
      <NotFound
        header='Forbidden'
        message='You do not have permission to view this event.'
        error='403'
      />
    );
  }

  if (!event) return null;

  /* -------------------- derived using your helpers -------------------- */
  const remaining = ticketsRemaining(event);
  const onSale = isOnSale(event);
  const dateRangeLabel = formatDateRangeLabel(event.startsAt, event.endsAt);

  // Headline price label
  let priceLabel = '—';
  if (event.priceType === 'free') {
    priceLabel = 'Free';
  } else if (event.priceType === 'payWhatYouWant') {
    priceLabel = 'Donation';
  } else {
    const cheapest = cheapestAvailableTicket(event);
    if (cheapest) {
      priceLabel = `From ${formatMoney(
        cheapest.price,
        cheapest.currency || event.currency
      )}`;
    } else if (typeof event.price === 'number') {
      priceLabel = formatMoney(event.price, event.currency);
    } else if (anyTicketTypeAvailable(event) === false) {
      priceLabel = 'Sold out';
    }
  }

  return (
    <div className='min-h-[60vh] text-zinc-100'>
      {/* HERO */}
      <div className='border border-transparent border-b-zinc-800'>
        <div className='mx-auto max-w-6xl px-4 py-6'>
          <div className='mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12'>
            {/* Image */}
            <div className='lg:col-span-8'>
              <div className='aspect-[16/9] overflow-hidden rounded-3xl bg-zinc-900 ring-1 ring-zinc-800'>
                <img
                  src={event.image}
                  alt={event.title}
                  className='h-full w-full object-cover'
                />
              </div>
            </div>

            {/* Ticket card */}
            <aside className='lg:col-span-4'>
              <div className='lg:sticky lg:top-6'>
                <div className='rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm'>
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <Text className='!text-zinc-300'>
                        <Strong className='block !text-zinc-100'>
                          {dateRangeLabel}
                        </Strong>
                        {venue ? (
                          <span className='text-zinc-400'>
                            {venue.city}, {venue.country}
                          </span>
                        ) : (
                          <span className='text-zinc-400'>Location TBA</span>
                        )}
                      </Text>
                    </div>

                    <Button
                      outline
                      className='!rounded-full !px-3 !py-1 text-xs'
                      onClick={() => {
                        if (navigator.share) {
                          navigator
                            .share({
                              title: event.title,
                              url: location.href,
                            })
                            .catch(() => {});
                        }
                      }}
                    >
                      <ShareIcon className='size-4' />
                      <span className='hidden lg:inline'>Share</span>
                    </Button>
                  </div>

                  <div className='mt-4 flex items-center gap-2'>
                    <TicketIcon className='size-5 text-zinc-300' />
                    <Text className='!m-0 !text-sm !text-zinc-300'>
                      Tickets
                    </Text>
                  </div>

                  <div className='mt-2 text-2xl font-semibold'>
                    {priceLabel}
                  </div>

                  <Button
                    href={`/checkout/${composeIdSlug(event.id, event.title)}`}
                    color='indigo'
                    className='mt-4 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 font-medium'
                    disabled={!onSale}
                  >
                    {onSale ? 'Get tickets' : 'Not on sale'}
                  </Button>

                  <div className='mt-4 flex items-center gap-2 text-xs text-zinc-400'>
                    <Badge color={onSale ? 'lime' : 'zinc'}>
                      {onSale ? 'On Sale' : 'Closed'}
                    </Badge>
                    <span>
                      • {remaining}/{event.capacity ?? 0} available
                    </span>
                  </div>

                  {/* Ticket options (read-only) */}
                  {Array.isArray(event.ticketTypes) &&
                    event.ticketTypes.length > 0 && (
                      <div className='mt-6 space-y-3'>
                        <Text className='!text-sm !font-medium !text-zinc-300'>
                          Ticket options
                        </Text>
                        <ul className='space-y-2'>
                          {event.ticketTypes.map((t) => {
                            const available =
                              t?.available === true &&
                              typeof t.price !== 'undefined';
                            return (
                              <li
                                key={t.id}
                                className={
                                  'flex items-center justify-between rounded-lg border px-4 py-3 ' +
                                  (available
                                    ? 'border-zinc-800 bg-zinc-900'
                                    : 'border-zinc-800 bg-zinc-950 opacity-60')
                                }
                              >
                                <Strong className='!text-zinc-100'>
                                  {t.name || t.id}
                                </Strong>
                                <Text className='!m-0 !text-sm !text-zinc-300'>
                                  {t.price === null
                                    ? event.priceType === 'payWhatYouWant'
                                      ? 'Donation'
                                      : 'Free'
                                    : formatMoney(
                                        t.price,
                                        t.currency || event.currency
                                      )}
                                </Text>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                  {event.refundPolicy && (
                    <div className='mt-4 flex items-start gap-3'>
                      <ShieldCheckIcon className='size-4 mt-0.5 text-zinc-300' />
                      <Text className='!m-0 !text-sm !text-zinc-300'>
                        {event.refundPolicy}
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className='mx-auto max-w-6xl px-4 py-8 grid grid-cols-1 gap-10 lg:grid-cols-12'>
        <section className='space-y-6 lg:col-span-8'>
          <Heading className='text-3xl md:text-4xl'>
            <Strong>{event.title}</Strong>
          </Heading>

          {event.description && (
            <Text className='!text-lg !leading-relaxed !text-zinc-300'>
              {event.description}
            </Text>
          )}

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4'>
              <CalendarDaysIcon className='size-5 mt-0.5 text-zinc-300' />
              <div>
                <Strong className='block'>Date &amp; Time</Strong>
                <Text className='!m-0 !text-zinc-300'>{dateRangeLabel}</Text>
              </div>
            </div>

            <div className='flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4'>
              <MapPinIcon className='size-5 mt-0.5 text-zinc-300' />
              <div>
                <Strong className='block'>
                  {venue?.name ?? 'Location TBA'}
                </Strong>
                <Text className='!m-0 !text-zinc-300'>
                  {venue
                    ? [venue.address, venue.city, venue.country]
                        .filter(Boolean)
                        .join(', ')
                    : '—'}
                </Text>
                {venue?.website && (
                  <Text className='!mt-1'>
                    <Link href={venue.website} target='_blank' rel='noreferrer'>
                      Visit venue website
                    </Link>
                  </Text>
                )}
              </div>
            </div>
          </div>
        </section>

        <aside className='space-y-6 lg:col-span-4'>
          {/* Organizer box */}
          <div className='rounded-3xl border border-zinc-800 bg-zinc-900 p-5'>
            <div className='flex items-start gap-3'>
              <div className='size-12 overflow-hidden grid place-items-center rounded-xl bg-zinc-800'>
                <UserGroupIcon className='size-6 text-zinc-300' />
              </div>
              <div className='flex-1'>
                <Strong className='block'>
                  {event.organizerName ?? 'Organizer'}
                </Strong>
                {event.organizerWebsite && (
                  <Text className='!m-0'>
                    <Link
                      href={event.organizerWebsite}
                      target='_blank'
                      rel='noreferrer'
                    >
                      {event.organizerWebsite}
                    </Link>
                  </Text>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
