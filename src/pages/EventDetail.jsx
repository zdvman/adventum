import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link as RRLink } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { composeIdSlug, splitIdSlug } from '@/utils/slug';
import { formatDate, formatTime24 } from '@/utils/FormatTimeStamp';
import { useAuth } from '@/contexts/useAuth';

// Catalyst UI
import { Heading } from '@/components/catalyst-ui-kit/heading';
import { Button } from '@/components/catalyst-ui-kit/button';
import { Badge } from '@/components/catalyst-ui-kit/badge';
import { Link } from '@/components/catalyst-ui-kit/link';
import { Strong } from '@/components/catalyst-ui-kit/text';

// Icons
import {
  CalendarDaysIcon,
  MapPinIcon,
  ShareIcon,
  TicketIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

// Shared UI
import Loading from '@/components/ui/Loading';

/* ----------------------- helpers ----------------------- */

function formatMoney(value, currency) {
  if (typeof value !== 'number') return '—';
  const cur = currency || '';
  return `${cur} ${value.toFixed(2)}`;
}

function formatDateRangeLabel(startsAt, endsAt) {
  try {
    const s = new Date(startsAt);
    const e = new Date(endsAt);
    return `${formatDate(s)} • ${formatTime24(s)} – ${formatTime24(e)}`;
  } catch {
    return '—';
  }
}

function getAvailableTicketTypes(event) {
  if (!Array.isArray(event.ticketTypes)) return [];
  return event.ticketTypes.filter((t) => t && t.available === true);
}

function getMinPricedTicket(tickets) {
  const priced = tickets.filter((t) => typeof t.price === 'number');
  if (priced.length === 0) return null;
  return priced.reduce((min, t) => (t.price < min.price ? t : min), priced[0]);
}

/* ----------------------- page ----------------------- */

export default function EventDetail() {
  const { setError } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const idSlug = params.idSlug ?? '';
  const { id } = useMemo(() => splitIdSlug(idSlug), [idSlug]);

  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [venue, setVenue] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setIsLoading(true);
      try {
        if (!id) {
          navigate('/404', { replace: true });
          return;
        }

        // Event
        const eventSnap = await getDoc(doc(db, 'events', id));
        if (!eventSnap.exists()) {
          navigate('/404', { replace: true });
          return;
        }
        const eventData = { id: eventSnap.id, ...eventSnap.data() };

        // Venue (optional)
        let venueData = null;
        if (eventData.venueId) {
          const venueSnap = await getDoc(doc(db, 'venues', eventData.venueId));
          if (venueSnap.exists())
            venueData = { id: venueSnap.id, ...venueSnap.data() };
        }

        if (ignore) return;

        // Normalize URL in case title changed
        const canonical = `/events/${composeIdSlug(
          eventData.id,
          eventData.title
        )}`;
        if (location.pathname !== canonical) {
          navigate(canonical, { replace: true });
        }

        setEvent(eventData);
        setVenue(venueData);
      } catch (error) {
        console.error(error);
        setError(error?.message || 'Failed to load event');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [id, navigate, setError]);

  if (isLoading) return <Loading />;
  if (!event) return null;

  /* -------- derived values -------- */

  const ticketsAvailableCount = Math.max(
    0,
    (event.capacity ?? 0) - (event.ticketsSold ?? 0)
  );

  const availableTicketTypes = getAvailableTicketTypes(event);

  const isOnSale =
    ticketsAvailableCount > 0 &&
    (availableTicketTypes.length > 0 ||
      event.priceType === 'free' ||
      event.priceType === 'payWhatYouWant' ||
      typeof event.price === 'number');

  // Top headline price
  let priceLabel = '—';
  if (event.priceType === 'free') {
    priceLabel = 'Free';
  } else if (event.priceType === 'payWhatYouWant') {
    priceLabel = 'Donation';
  } else {
    const minAvailable = getMinPricedTicket(availableTicketTypes);
    if (minAvailable) {
      priceLabel = `From ${formatMoney(
        minAvailable.price,
        minAvailable.currency || event.currency
      )}`;
    } else if (typeof event.price === 'number') {
      priceLabel = formatMoney(event.price, event.currency);
    } else {
      priceLabel = '—';
    }
  }

  const dateRangeLabel = formatDateRangeLabel(event.startsAt, event.endsAt);

  /* ----------------------- render ----------------------- */

  return (
    <div className='min-h-[60vh] text-zinc-100'>
      {/* HERO (AppLayout gives global header/sidebar) */}
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
                    <div className='text-sm text-zinc-300'>
                      <div className='font-medium text-zinc-100'>
                        {dateRangeLabel}
                      </div>
                      <div className='text-zinc-400'>
                        {venue
                          ? `${venue.city}, ${venue.country}`
                          : 'Location TBA'}
                      </div>
                    </div>
                    <Button
                      outline
                      className='!rounded-full !px-3 !py-1 text-xs'
                      onClick={() => {
                        if (navigator.share) {
                          navigator
                            .share({ title: event.title, url: location.href })
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
                    <div className='text-sm text-zinc-300'>Tickets</div>
                  </div>

                  <div className='mt-2 text-2xl font-semibold'>
                    {priceLabel}
                  </div>

                  <RRLink
                    to={`/checkout/${event.id}`}
                    className='mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 font-medium text-zinc-900 hover:opacity-90'
                  >
                    Get tickets
                  </RRLink>

                  {/* On Sale / Closed + capacity */}
                  <div className='mt-4 text-xs text-zinc-400 flex items-center gap-2'>
                    <Badge color={isOnSale ? 'lime' : 'zinc'}>
                      {isOnSale ? 'On Sale' : 'Closed'}
                    </Badge>
                    <span>
                      • {ticketsAvailableCount}/{event.capacity ?? 0} available
                    </span>
                  </div>

                  {/* Ticket options */}
                  {Array.isArray(event.ticketTypes) &&
                    event.ticketTypes.length > 0 && (
                      <div className='mt-6 space-y-3'>
                        <div className='text-sm font-medium text-zinc-400'>
                          Ticket options
                        </div>
                        <ul className='space-y-2'>
                          {event.ticketTypes.map((ticket) => {
                            const isAvailable = ticket.available === true;
                            return (
                              <li
                                key={ticket.id}
                                className={
                                  'flex items-center justify-between rounded-lg border px-4 py-3 relative ' +
                                  (isAvailable
                                    ? 'border-zinc-800 bg-zinc-900'
                                    : 'border-zinc-800 bg-zinc-950 opacity-60')
                                }
                              >
                                <div className='flex items-center gap-2 flex-1'>
                                  {/* optional: badge by id */}
                                  {ticket.id === 'early' && (
                                    <Badge color='lime' size='sm'>
                                      Early Bird
                                    </Badge>
                                  )}
                                  {ticket.id === 'std' && (
                                    <Badge color='blue' size='sm'>
                                      Standard
                                    </Badge>
                                  )}
                                  {ticket.id === 'vip' && (
                                    <Badge color='purple' size='sm'>
                                      VIP
                                    </Badge>
                                  )}
                                  {/* Center "Sold out" between badge and price */}
                                  {!isAvailable && (
                                    <span className='mx-auto text-zinc-100 font-medium pointer-events-none'>
                                      Sold out
                                    </span>
                                  )}
                                </div>

                                <div className='text-zinc-300 text-sm'>
                                  {ticket.price === null
                                    ? event.priceType === 'payWhatYouWant'
                                      ? 'Donation'
                                      : 'Free'
                                    : formatMoney(
                                        ticket.price,
                                        ticket.currency || event.currency
                                      )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                  {/* Refund policy */}
                  {event.refundPolicy && (
                    <div className='mt-4 flex items-start gap-3 text-sm text-zinc-300'>
                      <ShieldCheckIcon className='size-4 mt-0.5' />
                      <span>{event.refundPolicy}</span>
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
        <section className='lg:col-span-8 space-y-6'>
          <Heading className='text-3xl md:text-4xl'>
            <Strong>{event.title}</Strong>
          </Heading>

          {event.description && (
            <p className='text-zinc-300 text-lg leading-relaxed'>
              {event.description}
            </p>
          )}

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4'>
              <CalendarDaysIcon className='size-5 mt-0.5 text-zinc-300' />
              <div>
                <div className='font-medium'>Date & Time</div>
                <div className='text-zinc-300'>{dateRangeLabel}</div>
              </div>
            </div>
            <div className='flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4'>
              <MapPinIcon className='size-5 mt-0.5 text-zinc-300' />
              <div>
                <div className='font-medium'>
                  {venue?.name ?? 'Location TBA'}
                </div>
                <div className='text-zinc-300'>
                  {venue
                    ? [venue.address, venue.city, venue.country]
                        .filter(Boolean)
                        .join(', ')
                    : '—'}
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className='lg:col-span-4 space-y-6'>
          {/* Organizer box */}
          <div className='rounded-3xl border border-zinc-800 bg-zinc-900 p-5'>
            <div className='flex items-start gap-3'>
              <div className='size-12 rounded-xl bg-zinc-800 grid place-items-center overflow-hidden'>
                <UserGroupIcon className='size-6 text-zinc-300' />
              </div>
              <div className='flex-1'>
                <div className='font-semibold'>
                  {event.organizerName ?? 'Organizer'}
                </div>
                {event.organizerWebsite && (
                  <a
                    href={event.organizerWebsite}
                    target='_blank'
                    rel='noreferrer'
                    className='text-sm text-zinc-300 hover:underline'
                  >
                    {event.organizerWebsite}
                  </a>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
