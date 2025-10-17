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
  isSameDay,
  lc,
  shouldShowSaleBadgeInMyEvents,
  ticketsRemaining,
  tsToNumber,
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

  // UI state
  const [q, setQ] = useState('');
  const [searchBy, setSearchBy] = useState('any'); // any|title|date|venue
  const [sortBy, setSortBy] = useState('created_newest'); // created_newest|created_oldest|rejected_oldest
  const [status, setStatus] = useState('all'); // all|drafts|published|pending|rejected|approved

  const searchPlaceholder =
    searchBy === 'title'
      ? 'Search by title…'
      : searchBy === 'date'
      ? 'Start date (e.g. 2025-10-16)…'
      : searchBy === 'venue'
      ? 'Venue name, city, or country…'
      : 'Search my events…';

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
    const term = lc(q.trim());

    // 1) status filter (publish / moderation)
    let list = [...events];
    switch (status) {
      case 'drafts':
        list = list.filter((ev) => ev.publishStatus !== 'published');
        break;
      case 'published':
        list = list.filter((ev) => ev.publishStatus === 'published');
        break;
      case 'pending':
        list = list.filter((ev) => ev.moderationStatus === 'pending');
        break;
      case 'rejected':
        list = list.filter((ev) => ev.moderationStatus === 'rejected');
        break;
      case 'approved':
        list = list.filter((ev) => ev.moderationStatus === 'approved');
        break;
      default:
        // 'all' → no filter
        break;
    }

    // 2) search
    if (term) {
      list = list.filter((ev) => {
        const venue = venuesMap[ev.venueId];
        const venueName = lc(venue?.name);
        const venueCity = lc(venue?.city);
        const venueCountry = lc(venue?.country);

        switch (searchBy) {
          case 'title':
            return lc(ev.title).includes(term);
          case 'date':
            return isSameDay(ev.startsAt, term);
          case 'venue':
            return (
              venueName.includes(term) ||
              venueCity.includes(term) ||
              venueCountry.includes(term)
            );
          default:
            // any: title or venue bits
            return (
              lc(ev.title).includes(term) ||
              venueName.includes(term) ||
              venueCity.includes(term) ||
              venueCountry.includes(term)
            );
        }
      });
    }

    // 3) sort
    const sorted = [...list].sort((a, b) => {
      if (sortBy === 'created_oldest') {
        return (tsToNumber(a.createdAt) || 0) - (tsToNumber(b.createdAt) || 0);
      }
      if (sortBy === 'rejected_oldest') {
        // Rejected first (oldest first), then others by createdAt oldest first
        const ar = a.moderationStatus === 'rejected';
        const br = b.moderationStatus === 'rejected';
        if (ar !== br) return ar ? -1 : 1;

        const aT =
          tsToNumber(a.updatedAt) ||
          tsToNumber(a.createdAt) ||
          tsToNumber(a.startsAt);
        const bT =
          tsToNumber(b.updatedAt) ||
          tsToNumber(b.createdAt) ||
          tsToNumber(b.startsAt);
        return aT - bT; // oldest first
      }
      // default: 'created_newest'
      return (tsToNumber(b.createdAt) || 0) - (tsToNumber(a.createdAt) || 0);
    });

    // 4) view model
    return sorted.map((ev) => {
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
  }, [events, venuesMap, q, searchBy, sortBy, status]);

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
          <div className='mt-4 flex max-w-3xl flex-wrap gap-4'>
            {/* Search input */}
            <div className='min-w-[240px] flex-1'>
              <InputGroup>
                <MagnifyingGlassIcon />
                <Input
                  name='search'
                  placeholder={searchPlaceholder}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </InputGroup>
            </div>

            {/* Search by */}
            <div>
              <Select
                name='search_by'
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
              >
                <option value='any'>Search: Any</option>
                <option value='title'>Title</option>
                <option value='date'>Start date</option>
                <option value='venue'>Venue</option>
              </Select>
            </div>

            {/* Filter by status (publish/moderation) */}
            <div>
              <Select
                name='status'
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value='all'>All (default)</option>
                <option value='drafts'>Drafts</option>
                <option value='published'>Published</option>
                <option value='pending'>Pending</option>
                <option value='rejected'>Rejected</option>
                <option value='approved'>Approved</option>
              </Select>
            </div>

            {/* Sort */}
            <div>
              <Select
                name='sort_by'
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value='created_newest'>Newest / top</option>
                <option value='created_oldest'>Oldest / bottom</option>
                <option value='rejected_oldest'>Rejected (oldest first)</option>
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
