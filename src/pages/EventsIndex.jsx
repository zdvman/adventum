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
import { isOnSale, ticketsRemaining } from '@/utils/eventHelpers';
import Loading from '@/components/ui/Loading';
import AlertPopup from '@/components/ui/AlertPopup';

import {
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/16/solid';

import { getPublicEvents, getVenuesMap } from '@/services/api';

export default function EventsIndex() {
  const [events, setEvents] = useState([]);
  const [venuesMap, setVenuesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const [vMap, eList] = await Promise.all([
          getVenuesMap(),
          getPublicEvents(),
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
  }, [reloadTick]);

  const rows = useMemo(() => {
    return events.map((ev) => {
      const venue = venuesMap[ev.venueId];
      const ticketsAvailable = ticketsRemaining(ev);
      const onSale = isOnSale(ev);
      const idSlug = composeIdSlug(ev.id, ev.title);

      return {
        ev,
        venue,
        ticketsAvailable,
        onSale,
        idSlug,
      };
    });
  }, [events, venuesMap]);

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
          <div className='mt-4 flex max-w-xl gap-4'>
            <div className='flex-1'>
              <InputGroup>
                <MagnifyingGlassIcon />
                <Input name='search' placeholder='Search events…' />
              </InputGroup>
            </div>
            <div>
              <Select name='sort_by' defaultValue='date'>
                <option value='name'>Sort by name</option>
                <option value='date'>Sort by date</option>
                <option value='status'>Sort by status</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Anyone signed-in can create, but button is visible even if not (it will redirect to auth as needed) */}
        <Button href='/events/new'>Create event</Button>
      </div>

      <ul className='mt-10'>
        {rows.map(({ ev, venue, ticketsAvailable, onSale, idSlug }, idx) => (
          <li key={ev.id}>
            <Divider soft={idx > 0} />
            <div className='flex items-center justify-between'>
              <div className='flex gap-6 py-6'>
                <div className='w-32 shrink-0'>
                  <Link href={`/events/${idSlug}`} aria-hidden='true'>
                    <img
                      className='aspect-3/2 rounded-lg shadow-sm'
                      src={ev.image}
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
                  <div className='sm:hidden pt-1'>
                    <Badge
                      color={onSale ? 'lime' : 'zinc'}
                      className='text-[10px] px-2 py-0.5'
                    >
                      {onSale ? 'On Sale' : 'Closed'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-4'>
                <Badge
                  className='max-sm:hidden'
                  color={onSale ? 'lime' : 'zinc'}
                >
                  {onSale ? 'On Sale' : 'Closed'}
                </Badge>

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
        ))}
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
