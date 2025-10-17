// src/pages/EventsIndex.jsx
import { useEffect, useMemo, useState } from 'react';

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

import { formatDate, formatTime24 } from '@/utils/formatTimeStamp.js';
import { composeIdSlug } from '@/utils/slug';
import {
  isOnSale,
  shouldShowSaleBadgeInMyEvents,
  ticketsRemaining,
} from '@/utils/eventHelpers';
import Loading from '@/components/ui/Loading';
import AlertPopup from '@/components/ui/AlertPopup';

import {
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/16/solid';

import {
  getPublicEvents,
  getPublicEventsAll,
  getVenuesMap,
} from '@/services/api';
import { LifecycleBadge } from '@/components/ui/LifecycleBadge';

// --- local helpers (safe for Timestamp/ISO/Date) ---
function tsToNumber(x) {
  if (!x) return 0;
  if (typeof x === 'number') return x;
  if (typeof x.toMillis === 'function') return x.toMillis();
  if (typeof x === 'string') {
    const t = Date.parse(x);
    return Number.isNaN(t) ? 0 : t;
  }
  if (x instanceof Date) return x.getTime();
  return 0;
}
const lc = (v) => (v == null ? '' : String(v)).toLowerCase();
function isSameDay(dateLike, term) {
  const t = Date.parse(term);
  if (Number.isNaN(t)) return false;
  const d1 = new Date(dateLike);
  const d2 = new Date(t);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export default function EventsIndex() {
  const [events, setEvents] = useState([]);
  const [venuesMap, setVenuesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [reloadTick, setReloadTick] = useState(0);

  // UI state
  const [q, setQ] = useState('');
  const [searchBy, setSearchBy] = useState('any'); // any|title|date|venue
  const [sortBy, setSortBy] = useState('upcoming_soonest'); // upcoming_soonest|created_newest|created_oldest
  const [saleFilter, setSaleFilter] = useState('on'); // all|on

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const [vMap, eList] = await Promise.all([
          getVenuesMap(),
          saleFilter === 'all' ? getPublicEventsAll() : getPublicEvents(),
        ]);
        if (!alive) return;
        setVenuesMap(vMap);
        setEvents(eList);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        const msg =
          e?.message || 'Something went wrong while loading the events list.';
        setAlertTitle('Failed to load events');
        setAlertMessage(msg);
        setIsAlertOpen(true);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [reloadTick, saleFilter]);

  const searchPlaceholder =
    searchBy === 'title'
      ? 'Search by title…'
      : searchBy === 'date'
      ? 'Start date (e.g. 2025-10-16)…'
      : searchBy === 'venue'
      ? 'Venue name, city, or country…'
      : 'Search events…';

  // filter + sort + shape rows
  const rows = useMemo(() => {
    const term = lc(q.trim());

    // 1) filter by sale status
    let list = events.filter((ev) => {
      if (saleFilter === 'on' && !isOnSale(ev)) return false;
      return true;
    });

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
            // any: title or venue fields
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
      if (sortBy === 'created_newest') {
        return (tsToNumber(b.createdAt) || 0) - (tsToNumber(a.createdAt) || 0);
      }
      if (sortBy === 'created_oldest') {
        return (tsToNumber(a.createdAt) || 0) - (tsToNumber(b.createdAt) || 0);
      }
      // default: upcoming soonest (by startsAt asc)
      return (tsToNumber(a.startsAt) || 0) - (tsToNumber(b.startsAt) || 0);
    });

    // 4) view model
    return sorted.map((ev) => {
      const venue = venuesMap[ev.venueId];
      const ticketsAvailable = ticketsRemaining(ev);
      const showOnSale = shouldShowSaleBadgeInMyEvents(ev);
      const onSale = showOnSale ? isOnSale(ev) : false;
      const idSlug = composeIdSlug(ev.id, ev.title);

      return {
        ev,
        venue,
        ticketsAvailable,
        onSale,
        idSlug,
        showOnSale,
      };
    });
  }, [events, venuesMap, q, searchBy, sortBy, saleFilter]);

  if (loading) {
    return (
      <>
        <Loading label='Loading events…' />
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

  return (
    <>
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div className='max-sm:w-full sm:flex-1'>
          <Heading>Events</Heading>
          <div className='mt-4 flex max-w-3xl flex-wrap gap-4'>
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

            <div>
              <Select
                name='sort_by'
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value='upcoming_soonest'>Soonest upcoming</option>
                <option value='created_newest'>Newest added</option>
                <option value='created_oldest'>Oldest added</option>
              </Select>
            </div>

            <div>
              <Select
                name='sale'
                value={saleFilter}
                onChange={(e) => setSaleFilter(e.target.value)}
              >
                <option value='all'>All sale states</option>
                <option value='on'>On sale only</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Anyone signed-in can create, but button is visible even if not (it will redirect to auth as needed) */}
        <Button href='/events/new'>Create event</Button>
      </div>

      <ul className='mt-10'>
        {rows.map(
          (
            { ev, venue, ticketsAvailable, onSale, idSlug, showOnSale },
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
                      {showOnSale && (
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

                <div className='flex items-center gap-4'>
                  <LifecycleBadge ev={ev} className='max-sm:hidden' />
                  {showOnSale && (
                    <Badge
                      className='max-sm:hidden'
                      color={onSale ? 'lime' : 'zinc'}
                    >
                      {onSale ? 'On Sale' : 'Closed'}
                    </Badge>
                  )}

                  {/* Public list: only “View” action */}
                  {/* Mobile: show Ellipsis icon with dropdown */}
                  <div className='sm:hidden'>
                    <Dropdown>
                      <DropdownButton plain aria-label='More options'>
                        <EllipsisVerticalIcon className='w-5 h-5' />
                      </DropdownButton>
                      <DropdownMenu anchor='bottom end'>
                        <DropdownItem href={`/events/${idSlug}`}>
                          View
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>

                  {/* Desktop: show normal “View” button */}
                  <div className='hidden sm:block'>
                    <Button href={`/events/${idSlug}`} size='sm'>
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          )
        )}
      </ul>
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
