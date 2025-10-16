// src/pages/EventsIndexStaff.jsx
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

// 🔗 API layer
import {
  getVenuesMap,
  subscribeAllEventsForStaff,
  sortStaffEvents,
  deleteEventAsStaff,
  staffApproveEvent,
  staffRejectEvent,
} from '@/services/api';

export default function EventsIndexStaff() {
  const { profile } = useAuth();
  const isStaff = profile?.role === 'staff';

  const [events, setEvents] = useState([]);
  const [venuesMap, setVenuesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [reloadTick, setReloadTick] = useState(0);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!isStaff) return;
    let ignore = false;

    async function init() {
      setLoading(true);

      try {
        const vMap = await getVenuesMap(); // one-time
        if (ignore) return;
        setVenuesMap(vMap);

        const unsub = subscribeAllEventsForStaff((list) => {
          // sort on every snapshot
          list.sort(sortStaffEvents);
          setEvents(list);
          setLoading(false);
        });

        return unsub;
      } catch (e) {
        console.error(e);
        if (!ignore) {
          const msg = e?.message || 'Failed to load events';
          setAlertTitle('Failed to load events');
          setAlertMessage(msg);
          setIsAlertOpen(true);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    let cleanup;
    init().then((unsub) => {
      cleanup = unsub;
    });

    return () => {
      ignore = true;
      if (typeof cleanup === 'function') cleanup();
    };
  }, [isStaff, reloadTick]);

  const rows = useMemo(() => {
    return events.map((ev) => {
      const venue = venuesMap[ev.venueId];
      const ticketsAvailable = ticketsRemaining(ev);
      const showSale = shouldShowSaleBadgeInMyEvents(ev);
      const onSale = showSale ? isOnSale(ev) : false;
      const idSlug = composeIdSlug(ev.id, ev.title);

      const canEdit = true; // staff
      const canDelete = true; // staff
      const canApprove = ev.moderationStatus === 'pending';
      const canReject = ev.moderationStatus === 'pending';

      return {
        ev,
        venue,
        ticketsAvailable,
        onSale,
        idSlug,
        canEdit,
        canDelete,
        showSale,
        canApprove,
        canReject,
      };
    });
  }, [events, venuesMap]);

  async function handleDelete(ev) {
    const ok = confirm(
      `Delete event “${ev.title}”? This will also remove all related orders.`
    );
    if (!ok) return;

    setDeletingId(ev.id);
    try {
      const res = await deleteEventAsStaff(ev.id);
      if (!res?.deleted) throw new Error('Cascade delete failed.');
      // Realtime listener removes it; no manual setEvents needed
    } catch (e) {
      setAlertTitle('Delete failed');
      setAlertMessage(e?.message || 'Failed to delete event.');
      setIsAlertOpen(true);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleApprove(ev) {
    // optimistic flip
    setEvents((prev) =>
      prev
        .map((e) =>
          e.id === ev.id
            ? {
                ...e,
                moderationStatus: 'approved',
                updatedAt: new Date().toISOString(),
              }
            : e
        )
        .sort(sortStaffEvents)
    );
    try {
      await staffApproveEvent(ev.id);
      // snapshot will confirm; nothing else to do
    } catch (e) {
      // rollback on error
      setEvents((prev) =>
        prev
          .map((e) =>
            e.id === ev.id ? { ...e, moderationStatus: 'pending' } : e
          )
          .sort(sortStaffEvents)
      );
      setAlertTitle('Approve failed');
      setAlertMessage(e?.message || 'Failed to approve.');
      setIsAlertOpen(true);
    }
  }

  async function handleReject(ev) {
    // optimistic flip
    setEvents((prev) =>
      prev
        .map((e) =>
          e.id === ev.id
            ? {
                ...e,
                moderationStatus: 'rejected',
                updatedAt: new Date().toISOString(),
              }
            : e
        )
        .sort(sortStaffEvents)
    );
    try {
      await staffRejectEvent(ev.id);
    } catch (e) {
      // rollback on error
      setEvents((prev) =>
        prev
          .map((e) =>
            e.id === ev.id ? { ...e, moderationStatus: 'pending' } : e
          )
          .sort(sortStaffEvents)
      );
      setAlertTitle('Reject failed');
      setAlertMessage(e?.message || 'Failed to reject.');
      setIsAlertOpen(true);
    }
  }

  if (!isStaff) return null;
  if (loading) return <Loading label='Loading events…' />;

  const empty = events.length === 0;

  return (
    <>
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div className='max-sm:w-full sm:flex-1'>
          <Heading>All events (staff)</Heading>
          <div className='mt-4 flex max-w-xl gap-4'>
            <div className='flex-1'>
              <InputGroup>
                <MagnifyingGlassIcon />
                <Input name='search' placeholder='Search events…' />
              </InputGroup>
            </div>
            <div>
              {/* Sorting is handled client-side; this select can be wired up later */}
              <Select name='sort_by' defaultValue='pending_oldest' disabled>
                <option value='pending_oldest'>Pending first (oldest)</option>
              </Select>
            </div>
          </div>
        </div>
        <Button href='/events/new'>Create event</Button>
      </div>

      {empty ? (
        <div className='mt-10 rounded-xl border border-zinc-800 p-6 text-sm text-zinc-400'>
          No events yet.
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
                canApprove,
                canReject,
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
                          {canApprove && (
                            <DropdownItem
                              as='button'
                              onClick={() => handleApprove(ev)}
                            >
                              Approve
                            </DropdownItem>
                          )}
                          {canReject && (
                            <DropdownItem
                              as='button'
                              onClick={() => handleReject(ev)}
                            >
                              Reject
                            </DropdownItem>
                          )}
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
                          {canApprove && (
                            <DropdownItem
                              as='button'
                              onClick={() => handleApprove(ev)}
                            >
                              Approve
                            </DropdownItem>
                          )}
                          {canReject && (
                            <DropdownItem
                              as='button'
                              onClick={() => handleReject(ev)}
                            >
                              Reject
                            </DropdownItem>
                          )}
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
        confirmText='Try again'
        cancelText='Close'
        onConfirm={() => setReloadTick((t) => t + 1)}
      />
    </>
  );
}
