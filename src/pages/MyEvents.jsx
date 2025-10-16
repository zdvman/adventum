// src/pages/MyEvents.jsx
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/useAuth';

import { Badge } from '@/components/catalyst-ui-kit/badge';
import { Button } from '@/components/catalyst-ui-kit/button';
import { Divider } from '@/components/catalyst-ui-kit/divider';
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from '@/components/catalyst-ui-kit/dropdown';
import { Heading } from '@/components/catalyst-ui-kit/heading';
import { Input, InputGroup } from '@/components/catalyst-ui-kit/input';
import { Link } from '@/components/catalyst-ui-kit/link';
import { Select } from '@/components/catalyst-ui-kit/select';
import { Strong, TextLink } from '@/components/catalyst-ui-kit/text';

import { formatDate, formatTime24 } from '@/utils/formatTimeStamp';
import { composeIdSlug } from '@/utils/slug';
import {
  isOnSale,
  shouldShowSaleBadgeInMyEvents,
  ticketsRemaining,
} from '@/utils/eventHelpers';

import {
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/16/solid';

import { LifecycleBadge } from '@/components/ui/LifecycleBadge';
import Loading from '@/components/ui/Loading';
import AlertPopup from '@/components/ui/AlertPopup';

// 🔗 API layer (only user-owned events)
import {
  getVenuesMap,
  getMyEvents,
  deleteEventAsCreator,
} from '@/services/api';

export default function MyEvents() {
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [venuesMap, setVenuesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertConfirm, setAlertConfirm] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    let ignore = false;
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const [vMap, myEvents] = await Promise.all([
          getVenuesMap(),
          getMyEvents(user.uid), // ⬅️ only events created by this user
        ]);
        if (!ignore) {
          setVenuesMap(vMap);
          setEvents(myEvents);
        }
      } catch (e) {
        console.error(e);
        if (!ignore) {
          const msg = e?.message || 'Failed to load your events';
          setErr(msg);
          setAlertTitle('Could not load your events');
          setAlertMessage(msg);
          setAlertConfirm(() => () => setReloadTick((t) => t + 1)); // retry
          setIsAlertOpen(true);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [user?.uid, reloadTick]);

  const rows = useMemo(() => {
    return events.map((ev) => {
      const venue = venuesMap[ev.venueId];
      const ticketsAvailable = ticketsRemaining(ev);
      const showSale = shouldShowSaleBadgeInMyEvents(ev);
      const onSale = showSale ? isOnSale(ev) : false;
      const idSlug = composeIdSlug(ev.id, ev.title);

      // This page lists ONLY the current user's events:
      const canEdit = true;
      // Creator can delete only if not published (Cloud Function also checks no orders)
      const canDelete = ev.publishStatus !== 'published';

      return {
        ev,
        venue,
        ticketsAvailable,
        onSale,
        idSlug,
        canEdit,
        canDelete,
        showSale,
      };
    });
  }, [events, venuesMap]);

  async function handleDelete(ev) {
    const ok = confirm(
      `Delete event “${ev.title}”? This is only allowed if it’s not published and has no orders.`
    );
    if (!ok) return;

    setDeletingId(ev.id);
    try {
      const res = await deleteEventAsCreator(ev.id);
      if (!res?.deleted) {
        const reason =
          res?.message || 'Event cannot be deleted (published or has orders).';
        throw new Error(reason);
      }
      setEvents((prev) => prev.filter((e) => e.id !== ev.id));
    } catch (e) {
      setAlertTitle('Delete failed');
      setAlertMessage(e?.message || 'Failed to delete event.');
      setAlertConfirm(null);
      setIsAlertOpen(true);
    } finally {
      setDeletingId(null);
    }
  }

  if (!user?.uid) return null;
  if (loading) return <Loading label='Loading your events…' />;
  if (err) return <div className='py-10 text-sm text-red-500'>{err}</div>;

  const empty = events.length === 0;

  return (
    <>
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div className='max-sm:w-full sm:flex-1'>
          <Heading>My events</Heading>
          <div className='mt-4 flex max-w-xl gap-4'>
            <div className='flex-1'>
              <InputGroup>
                <MagnifyingGlassIcon />
                <Input name='search' placeholder='Search my events…' />
              </InputGroup>
            </div>
            <div>
              <Select name='sort_by' defaultValue='starts_desc'>
                <option value='starts_desc'>Newest first</option>
                <option value='starts_asc'>Oldest first</option>
                <option value='name'>By name</option>
              </Select>
            </div>
          </div>
        </div>
        <Button href='/events/new'>Create event</Button>
      </div>

      {empty ? (
        <div className='mt-10 rounded-xl border border-zinc-800 p-6 text-sm text-zinc-400'>
          You don’t have any events yet.{' '}
          <TextLink href='/events/new'>
            <Strong>Create your first event</Strong>
          </TextLink>
          .
        </div>
      ) : (
        <ul className='mt-10'>
          {rows.map(
            (
              {
                ev,
                venue,
                ticketsAvailable,
                onSale,
                idSlug,
                canEdit,
                canDelete,
                showSale,
              },
              idx
            ) => (
              <li key={ev.id}>
                <Divider soft={idx > 0} />
                <div className='flex items-center justify-between'>
                  <div className='flex gap-6 py-6'>
                    <div className='w-32 shrink-0'>
                      <Link href={`/events/${idSlug}`} aria-hidden='true'>
                        <img
                          className='aspect-3/2 rounded-lg shadow-sm'
                          src={ev.image || '/images/events/placeholder.png'}
                          alt={ev.title}
                        />
                      </Link>
                    </div>
                    <div className='space-y-1.5'>
                      <TextLink href={`/events/${idSlug}`}>
                        <Strong>{ev.title}</Strong>
                      </TextLink>

                      <div className='text-xs/6 text-zinc-500'>
                        {formatDate(ev.startsAt)} at {formatTime24(ev.startsAt)}{' '}
                        <span aria-hidden='true'>·</span>{' '}
                        {venue ? `${venue.city}, ${venue.country}` : '—'}
                      </div>

                      <div className='text-xs/6 text-zinc-600'>
                        Available tickets {ticketsAvailable}/{ev.capacity ?? 0}
                      </div>

                      {/* MOBILE: badges inside info block */}
                      <div className='sm:hidden pt-1 flex items-center gap-2'>
                        <LifecycleBadge
                          ev={ev}
                          className='text-[10px] px-2 py-0.5'
                        />
                        {showSale && (
                          <Badge
                            color={onSale ? 'lime' : 'zinc'}
                            className='text-[10px] px-2 py-0.5'
                          >
                            {onSale ? 'On Sale' : 'Closed'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: desktop badges + actions */}
                  <div className='flex items-center gap-4'>
                    <LifecycleBadge ev={ev} className='max-sm:hidden' />
                    {showSale && (
                      <Badge
                        className='max-sm:hidden'
                        color={onSale ? 'lime' : 'zinc'}
                      >
                        {onSale ? 'On Sale' : 'Closed'}
                      </Badge>
                    )}

                    {/* ACTIONS — mobile ellipsis + desktop "Actions" */}
                    <div className='sm:hidden'>
                      <Dropdown>
                        <DropdownButton plain aria-label='More options'>
                          <EllipsisVerticalIcon className='w-5 h-5' />
                        </DropdownButton>
                        <DropdownMenu anchor='bottom end'>
                          <DropdownItem href={`/events/${idSlug}`}>
                            View
                          </DropdownItem>
                          {canEdit && (
                            <DropdownItem href={`/events/${ev.id}/edit`}>
                              Edit
                            </DropdownItem>
                          )}
                          {canDelete && (
                            <DropdownItem
                              as='button'
                              onClick={() => handleDelete(ev)}
                              disabled={deletingId === ev.id}
                            >
                              {deletingId === ev.id ? 'Deleting…' : 'Delete'}
                            </DropdownItem>
                          )}
                        </DropdownMenu>
                      </Dropdown>
                    </div>

                    <div className='hidden sm:block'>
                      <Dropdown>
                        <DropdownButton size='sm' color='zinc'>
                          Actions
                        </DropdownButton>
                        <DropdownMenu anchor='bottom end'>
                          <DropdownItem href={`/events/${idSlug}`}>
                            View
                          </DropdownItem>
                          {canEdit && (
                            <DropdownItem href={`/events/${ev.id}/edit`}>
                              Edit
                            </DropdownItem>
                          )}
                          {canDelete && (
                            <DropdownItem
                              as='button'
                              onClick={() => handleDelete(ev)}
                              disabled={deletingId === ev.id}
                            >
                              {deletingId === ev.id ? 'Deleting…' : 'Delete'}
                            </DropdownItem>
                          )}
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </div>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      {deletingId && <Loading label='Deleting event…' />}

      <AlertPopup
        isOpen={isAlertOpen}
        setIsOpen={setIsAlertOpen}
        title={alertTitle}
        description={alertMessage}
        confirmText={alertConfirm ? 'Try again' : 'OK'}
        cancelText={alertConfirm ? 'Close' : undefined}
        onConfirm={alertConfirm || undefined}
      />
    </>
  );
}
