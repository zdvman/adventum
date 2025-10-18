// src/pages/EventDetail.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';

import { composeIdSlug, splitIdSlug } from '@/utils/slug';
import {
  ticketsRemaining,
  anyTicketTypeAvailable,
  isOnSale,
  formatMoney,
  cheapestAvailableTicket,
  shouldShowSaleBadgeInMyEvents,
} from '@/utils/eventHelpers';

// Catalyst UI
import { Heading } from '@/components/catalyst-ui-kit/heading';
import { Button } from '@/components/catalyst-ui-kit/button';
import { Input } from '@/components/catalyst-ui-kit/input';
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
import { LifecycleBadge } from '@/components/ui/LifecycleBadge';
import AlertPopup from '@/components/ui/AlertPopup';

import {
  getEventByIdServer,
  getVenueById,
  staffApproveEvent,
  staffRejectEvent,
  userHasOrderForEvent,
} from '@/services/api';
import { buildGoogleCalendarUrl } from '@/services/calendarLinks';

export default function EventDetail() {
  const { user, profile, initializing, setError } = useAuth();
  const navigate = useNavigate();
  const { idSlug = '' } = useParams();
  const { id } = useMemo(() => splitIdSlug(idSlug), [idSlug]);

  const [loading, setLoading] = useState(true);
  const [guard, setGuard] = useState('ok'); // 'ok' | 'forbidden' | 'notfound'
  const [event, setEvent] = useState(null);
  const [venue, setVenue] = useState(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [qty, setQty] = useState(1);
  const [qtyDraft, setQtyDraft] = useState(null);
  const [hasOrder, setHasOrder] = useState(false);

  const remaining = event ? ticketsRemaining(event) : 0;
  const maxQty = Math.min(10, Math.max(0, remaining));
  const minQty = remaining > 0 ? 1 : 0;

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
          evSnap = await getEventByIdServer(id);
        } catch (e) {
          // If Firestore denies read, treat as forbidden (event may exist)
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
          const vSnap = await getVenueById(ev.venueId);
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
        // keep explicit guard decisions
        console.error('EventDetail load error:', e);
        const msg = e?.message || 'Failed to load event';
        setError?.(msg);
        setAlertTitle('Could not load event');
        setAlertMessage(msg);
        setIsAlertOpen(true);
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
  }, [id, navigate, setError, initializing, user?.uid, profile?.role, user]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user?.uid || !event?.id) {
        if (alive) setHasOrder(false);
        return;
      }
      const yes = await userHasOrderForEvent(user.uid, event.id);
      if (alive) setHasOrder(yes);
    })();
    return () => {
      alive = false;
    };
  }, [user?.uid, event?.id]);

  useEffect(() => {
    setQty((prev) => {
      if (maxQty === 0) return 0;
      if (!Number.isInteger(prev) || prev < 1) return 1;
      if (prev > maxQty) return maxQty;
      return prev;
    });
  }, [maxQty]);

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
  const onSale = isOnSale(event);
  const showSale = shouldShowSaleBadgeInMyEvents(event);
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
    <>
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
                              .share({ title: event.title, url: location.href })
                              .catch((err) => {
                                if (err?.name !== 'AbortError') {
                                  setAlertTitle('Share failed');
                                  setAlertMessage(
                                    err?.message ||
                                      'Unable to open the share sheet.'
                                  );
                                  setIsAlertOpen(true);
                                }
                              });
                          } else {
                            setAlertTitle('Sharing not supported');
                            setAlertMessage(
                              'Your browser does not support the native share dialog.'
                            );
                            setIsAlertOpen(true);
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

                    {(profile?.role === 'staff' ||
                      (user && event.createdBy === user.uid)) && (
                      <div className='mt-4 flex gap-2'>
                        <Button href={`/events/${event.id}/edit`} size='sm'>
                          Edit
                        </Button>

                        {profile?.role === 'staff' &&
                          event.publishStatus === 'published' &&
                          event.moderationStatus === 'pending' && (
                            <>
                              <Button
                                size='sm'
                                color='green'
                                onClick={async () => {
                                  try {
                                    await staffApproveEvent(event.id);
                                  } catch (e) {
                                    setAlertTitle('Approve failed');
                                    setAlertMessage(e?.message || '');
                                    setIsAlertOpen(true);
                                  }
                                }}
                              >
                                Approve
                              </Button>

                              <Button
                                size='sm'
                                color='red'
                                onClick={async () => {
                                  try {
                                    await staffRejectEvent(event.id);
                                  } catch (e) {
                                    setAlertTitle('Reject failed');
                                    setAlertMessage(e?.message || '');
                                    setIsAlertOpen(true);
                                  }
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                      </div>
                    )}

                    <div className='mt-2 text-2xl font-semibold'>
                      {priceLabel}
                    </div>

                    {/* Quantity stepper (hidden if sold out) */}
                    {remaining > 0 && (
                      <div className='mt-4 flex items-stretch gap-2'>
                        <Button
                          outline
                          color='zinc'
                          className='!rounded-xl !px-3'
                          aria-label='Decrease quantity'
                          onClick={() => {
                            setQtyDraft(null); // exit edit mode
                            setQty((n) => Math.max(minQty, (n || 0) - 1));
                          }}
                          disabled={qty <= minQty}
                        >
                          –
                        </Button>

                        <div className='w-24'>
                          <Input
                            // use text + numeric keyboard; we control digits ourselves
                            type='text'
                            inputMode='numeric'
                            pattern='[0-9]*'
                            value={qtyDraft ?? String(qty)}
                            onFocus={(e) => {
                              // select all so the first key replaces the old value
                              e.target.select();
                              setQtyDraft(String(qty));
                            }}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D+/g, '');
                              // allow empty while typing (user can clear)
                              setQtyDraft(digits);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.currentTarget.blur(); // commit on Enter
                            }}
                            onBlur={() => {
                              const n =
                                qtyDraft === '' ? NaN : Number(qtyDraft);
                              const clamped = Number.isFinite(n)
                                ? Math.min(
                                    maxQty,
                                    Math.max(minQty, Math.floor(n))
                                  )
                                : minQty;
                              setQty(clamped);
                              setQtyDraft(null); // leave edit mode
                            }}
                            className='text-center'
                            aria-label='Ticket quantity'
                          />
                        </div>

                        <Button
                          outline
                          color='zinc'
                          className='!rounded-xl !px-3'
                          aria-label='Increase quantity'
                          onClick={() => {
                            setQtyDraft(null); // exit edit mode
                            setQty((n) => Math.min(maxQty, (n || 0) + 1));
                          }}
                          disabled={qty >= maxQty}
                        >
                          +
                        </Button>
                      </div>
                    )}

                    <Button
                      href={`/checkout/${event.id}?qty=${qty}`}
                      color='indigo'
                      className='mt-4 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 font-medium'
                      disabled={!showSale || !onSale || remaining <= 0}
                    >
                      {onSale && showSale ? 'Get tickets' : 'Not on sale'}
                    </Button>
                    {hasOrder && (
                      <Button
                        color='zinc'
                        outline
                        className='mt-2 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3'
                        onClick={() => {
                          const tz =
                            Intl.DateTimeFormat().resolvedOptions().timeZone;
                          const loc = venue
                            ? [venue.name, venue.city, venue.country]
                                .filter(Boolean)
                                .join(', ')
                            : '';
                          const url = buildGoogleCalendarUrl({
                            title: event.title,
                            startsAt: event.startsAt,
                            endsAt: event.endsAt,
                            location: loc,
                            description: event.description || '',
                            ctz: tz,
                            url: `${
                              window.location.origin
                            }/events/${composeIdSlug(event.id, event.title)}`,
                          });
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                      >
                        Add to Google Calendar
                      </Button>
                    )}

                    <div className='mt-4 flex items-center gap-2 text-xs text-zinc-400'>
                      {showSale && (
                        <Badge color={onSale ? 'lime' : 'zinc'}>
                          {onSale ? 'On Sale' : 'Closed'}
                        </Badge>
                      )}
                      <LifecycleBadge
                        ev={event}
                        className='text-[10px] px-2 py-0.5'
                      />
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
                      <Link
                        href={venue.website}
                        target='_blank'
                        rel='noreferrer'
                      >
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
      <AlertPopup
        isOpen={isAlertOpen}
        setIsOpen={setIsAlertOpen}
        title={alertTitle}
        description={alertMessage}
        confirmText='OK'
      />
    </>
  );
}
