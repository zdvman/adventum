import { useEffect, useMemo, useState } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';

import { Avatar } from '@/components/catalyst-ui-kit/avatar';
import { Badge } from '@/components/catalyst-ui-kit/badge';
import { Button } from '@/components/catalyst-ui-kit/button';
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from '@/components/catalyst-ui-kit/description-list';
import { Divider } from '@/components/catalyst-ui-kit/divider';
import { Heading, Subheading } from '@/components/catalyst-ui-kit/heading';
import Loading from '@/components/ui/Loading';
import { formatMoney, shortId } from '@/utils/eventHelpers';

import { getOrderById, getEventById, getVenueById } from '@/services/api';
import { buildGoogleCalendarUrl } from '@/services/calendarLinks';

function statusMeta(o) {
  if (!o) return { color: 'zinc', label: '—' };
  if (o.status === 'paid') return { color: 'lime', label: 'Paid' };
  if (o.status === 'confirmed')
    return { color: 'lime', label: 'Confirmed (free)' };
  if (o.status === 'paid_over_capacity')
    return { color: 'amber', label: 'Paid - over capacity' };
  if (o.status === 'refunded') return { color: 'red', label: 'Refunded' };
  return { color: 'zinc', label: o.status || '—' };
}

export default function Order() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [event, setEvent] = useState(null);
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedSession, setCopiedSession] = useState(false);
  const [copiedIntent, setCopiedIntent] = useState(false);

  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const o = await getOrderById(id);
        if (!o) {
          if (alive) setErr('Order not found');
          return;
        }

        let ev = null;
        if (o.eventId) {
          // Normal get (public rules). If the event is hidden now, we’ll just show “Event unavailable”.
          ev = await getEventById(o.eventId);
        }

        let v = null;
        if (ev?.venueId) {
          const vSnap = await getVenueById(ev.venueId);
          if (vSnap?.exists()) v = { id: vSnap.id, ...vSnap.data() };
        }

        if (alive) {
          setOrder(o);
          setEvent(ev);
          setVenue(v);
        }
      } catch (e) {
        if (alive) setErr(e?.message || 'Failed to load order');
      } finally {
        if (alive) setLoading(false);
      }
    }
    if (id) run();
    return () => {
      alive = false;
    };
  }, [id]);

  const prettyId = useMemo(
    () => (order?.orderCode ? `#${order.orderCode}` : shortId(order?.id || '')),
    [order]
  );

  const shortSessionId = useMemo(
    () => (order?.stripeSessionId ? shortId(order.stripeSessionId) : '—'),
    [order]
  );
  const shortPaymentIntentId = useMemo(
    () =>
      order?.stripePaymentIntentId ? shortId(order.stripePaymentIntentId) : '—',
    [order]
  );

  if (loading) return <Loading label='Loading order…' />;
  if (err) return <div className='py-8 text-sm text-red-500'>{err}</div>;
  if (!order) return <div className='text-center py-20'>Order not found</div>;

  const createdAt =
    order.createdAt?.toDate?.() ||
    (order.createdAt ? new Date(order.createdAt) : null);
  const dateStr = createdAt
    ? createdAt.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';
  const { color, label } = statusMeta(order);
  const unit = formatMoney(order.unitPrice || 0, order.currency || 'USD');
  const total = formatMoney(order.total || 0, order.currency || 'USD');

  return (
    <>
      <div className='mt-4 lg:mt-8'>
        <div className='flex items-center gap-4'>
          <Heading>Order {prettyId}</Heading>
          <Badge color={color}>{label}</Badge>
        </div>
        <div className='isolate mt-2.5 flex flex-wrap justify-between gap-x-6 gap-y-3 text-sm'>
          <div className='flex flex-wrap gap-x-6 gap-y-2 text-zinc-400'>
            <span>
              Placed on <span className='text-zinc-200'>{dateStr}</span>
            </span>
            <span className='hidden sm:inline'>•</span>
            <span>
              Type{' '}
              <span className='text-zinc-200'>{order.priceType || '—'}</span>
            </span>
            <span className='hidden sm:inline'>•</span>
            <span>
              Provider{' '}
              <span className='text-zinc-200'>
                {order.paymentProvider || '—'}
              </span>
            </span>
          </div>
          <div className='flex gap-2 sm:gap-3'>
            <Button
              color='zinc'
              outline
              onClick={() => navigate('/account/orders')}
            >
              Back to Orders
            </Button>
            {order.eventId ? (
              <Button href={`/events/${order.eventId}`} color='indigo'>
                View event
              </Button>
            ) : null}
            {event ? (
              <Button
                color='indigo'
                onClick={() => {
                  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
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
                    url: `${window.location.origin}/events/${event.id}`,
                  });
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
              >
                Add to Google Calendar
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className='mt-12'>
        <Subheading>Summary</Subheading>
        <Divider className='mt-4' />
        <DescriptionList>
          <DescriptionTerm>Order ID</DescriptionTerm>
          <DescriptionDetails>
            <span className='text-zinc-200'>{prettyId}</span>
            {order.id && (
              <>
                <button
                  className='ml-2 text-xs text-zinc-400 hover:text-zinc-200 underline'
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(order.id);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1200);
                    } catch (error) {
                      console.error('Failed to copy ID:', error);
                    }
                  }}
                >
                  copy full id
                </button>
                {copied && (
                  <span className='ml-1 text-xs text-emerald-400'>Copied!</span>
                )}
              </>
            )}
          </DescriptionDetails>

          <DescriptionTerm>Event</DescriptionTerm>
          <DescriptionDetails>
            {event ? (
              <RouterLink
                to={`/events/${event.id}`}
                className='flex items-center gap-2 text-indigo-400 hover:underline'
              >
                {event.image ? (
                  <Avatar src={event.image} className='size-6' />
                ) : null}
                <span className='text-zinc-100'>{event.title}</span>
              </RouterLink>
            ) : (
              <span className='text-zinc-400'>Event unavailable</span>
            )}
          </DescriptionDetails>

          <DescriptionTerm>Quantity</DescriptionTerm>
          <DescriptionDetails>{order.quantity || 0}</DescriptionDetails>

          <DescriptionTerm>Unit price</DescriptionTerm>
          <DescriptionDetails>{unit}</DescriptionDetails>

          <DescriptionTerm>Total</DescriptionTerm>
          <DescriptionDetails className='font-semibold text-zinc-100'>
            {total}
          </DescriptionDetails>
        </DescriptionList>
      </div>

      <div className='mt-12'>
        <Subheading>Payment</Subheading>
        <Divider className='mt-4' />
        <DescriptionList>
          <DescriptionTerm>Payment status</DescriptionTerm>
          <DescriptionDetails>{order.paymentStatus || '—'}</DescriptionDetails>
          <DescriptionTerm>Stripe session</DescriptionTerm>
          <DescriptionDetails>
            <span
              className='text-zinc-200'
              title={order.stripeSessionId || undefined}
            >
              {shortSessionId}
            </span>
            {order.stripeSessionId && (
              <>
                <button
                  className='ml-2 text-xs text-zinc-400 hover:text-zinc-200 underline'
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        order.stripeSessionId
                      );
                      setCopiedSession(true);
                      setTimeout(() => setCopiedSession(false), 1200);
                    } catch (error) {
                      console.error('Failed to copy session ID:', error);
                    }
                  }}
                  aria-label='Copy full Stripe session id'
                  title='Copy full id'
                >
                  copy full id
                </button>
                {copiedSession && (
                  <span className='ml-1 text-xs text-emerald-400'>Copied!</span>
                )}
              </>
            )}
          </DescriptionDetails>
          <DescriptionTerm>Payment intent</DescriptionTerm>
          <DescriptionDetails>
            <span
              className='text-zinc-200'
              title={order.stripePaymentIntentId || undefined}
            >
              {shortPaymentIntentId}
            </span>
            {order.stripePaymentIntentId && (
              <>
                <button
                  className='ml-2 text-xs text-zinc-400 hover:text-zinc-200 underline'
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        order.stripePaymentIntentId
                      );
                      setCopiedIntent(true);
                      setTimeout(() => setCopiedIntent(false), 1200);
                    } catch (error) {
                      console.error('Failed to copy intent ID:', error);
                    }
                  }}
                  aria-label='Copy full payment intent id'
                  title='Copy full id'
                >
                  copy full id
                </button>
                {copiedIntent && (
                  <span className='ml-1 text-xs text-emerald-400'>Copied!</span>
                )}
              </>
            )}
          </DescriptionDetails>
        </DescriptionList>
      </div>
    </>
  );
}
