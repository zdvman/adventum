// src/pages/EventsIndex.jsx
import { useEffect, useMemo, useState } from 'react';
import { db } from '@/services/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

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
import { formatDate, formatTime24 } from '@/utils/FormatTimeStamp';
import {
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/16/solid';
import { composeIdSlug } from '@/utils/slug';

export default function EventsIndex() {
  const [events, setEvents] = useState([]);
  const [venuesMap, setVenuesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        // 1) Fetch venues (small list → fine to load all and map by id)
        const vSnap = await getDocs(collection(db, 'venues'));
        const vMap = {};
        vSnap.forEach((d) => (vMap[d.id] = { id: d.id, ...d.data() }));
        setVenuesMap(vMap);

        // 2) Fetch only future, approved, published events (ordered soonest first)
        const nowIso = new Date().toISOString();
        const qy = query(
          collection(db, 'events'),
          where('endsAt', '>', nowIso),
          where('publishStatus', '==', 'published'),
          where('moderationStatus', '==', 'approved'),
          orderBy('endsAt', 'asc')
        );
        const eSnap = await getDocs(qy);
        const list = [];
        eSnap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setEvents(list);
      } catch (e) {
        console.error(e);
        setErr(e.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const rows = useMemo(() => {
    return events.map((ev) => {
      const venue = venuesMap[ev.venueId];
      const ticketsAvailable = Math.max(
        0,
        (ev.capacity ?? 0) - (ev.ticketsSold ?? 0)
      );
      const onSale = ticketsAvailable > 0;
      const idSlug = composeIdSlug(ev.id, ev.title);
      return { ev, venue, ticketsAvailable, onSale, idSlug };
    });
  }, [events, venuesMap]);

  if (loading) {
    return <div className='py-10 text-sm text-zinc-500'>Loading events…</div>;
  }
  if (err) {
    return <div className='py-10 text-sm text-red-500'>{err}</div>;
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
                <Input name='search' placeholder='Search events&hellip;' />
              </InputGroup>
            </div>
            <div>
              <Select name='sort_by'>
                <option value='name'>Sort by name</option>
                <option value='date'>Sort by date</option>
                <option value='status'>Sort by status</option>
              </Select>
            </div>
          </div>
        </div>
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
                </div>
              </div>

              <div className='flex items-center gap-4'>
                <Badge
                  className='max-sm:hidden'
                  color={onSale ? 'lime' : 'zinc'}
                >
                  {onSale ? 'On Sale' : 'Closed'}
                </Badge>

                <Dropdown>
                  <DropdownButton plain aria-label='More options'>
                    <EllipsisVerticalIcon />
                  </DropdownButton>
                  <DropdownMenu anchor='bottom end'>
                    <DropdownItem href={`/events/${idSlug}`}>View</DropdownItem>
                    <DropdownItem href={`/events/${ev.id}/edit`}>
                      Edit
                    </DropdownItem>
                    <DropdownItem as='button'>Delete</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
