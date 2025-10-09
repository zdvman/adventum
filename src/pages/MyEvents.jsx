// src/pages/MyEvents.jsx
import { useEffect, useMemo, useState } from 'react';
import { db } from '@/services/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  deleteDoc,
} from 'firebase/firestore';

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
import { formatDate, formatTime24 } from '@/utils/FormatTimeStamp';
import {
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/16/solid';
import { composeIdSlug } from '@/utils/slug';
import { isOnSale } from '@/utils/eventHelpers';
import { LifecycleBadge } from '@/components/ui/LifecycleBadge';

export default function MyEvents() {
  const { user, profile } = useAuth();

  const [events, setEvents] = useState([]);
  const [venuesMap, setVenuesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        // Load only venues referenced by user's events — but since we don't know them yet,
        // we can (for simplicity) load all venues. If this grows large, switch to a batched fetch by ids.
        const vSnap = await getDocs(collection(db, 'venues'));
        const vMap = {};
        vSnap.forEach((d) => (vMap[d.id] = { id: d.id, ...d.data() }));
        setVenuesMap(vMap);

        // All events created by me (include drafts/unpublished)
        const qy = query(
          collection(db, 'events'),
          where('createdBy', '==', user.uid),
          orderBy('startsAt', 'desc')
        );
        const eSnap = await getDocs(qy);
        const list = [];
        eSnap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setEvents(list);
      } catch (e) {
        console.error(e);
        setErr(e.message || 'Failed to load your events');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.uid]);

  const rows = useMemo(() => {
    return events.map((ev) => {
      const venue = venuesMap[ev.venueId];
      const ticketsAvailable = Math.max(
        0,
        (ev.capacity ?? 0) - (ev.ticketsSold ?? 0)
      );
      const onSale = isOnSale(ev); // was this code - ticketsAvailable > 0;
      const idSlug = composeIdSlug(ev.id, ev.title);

      // I own these; staff also owns everything effectively.
      const isOwner = user?.uid === ev.createdBy;
      const isStaff = profile?.role === 'staff';
      const canEdit = isOwner || isStaff;
      const canDelete = canEdit;

      return {
        ev,
        venue,
        ticketsAvailable,
        onSale,
        idSlug,
        canEdit,
        canDelete,
      };
    });
  }, [events, venuesMap, user?.uid, profile?.role]);

  async function handleDelete(ev) {
    const ok = confirm(`Delete event “${ev.title}”? This cannot be undone.`);
    if (!ok) return;
    try {
      await deleteDoc(doc(db, 'events', ev.id));
      setEvents((prev) => prev.filter((e) => e.id !== ev.id));
    } catch (e) {
      alert(e.message || 'Failed to delete event.');
    }
  }

  if (!user?.uid) return null;
  if (loading)
    return (
      <div className='py-10 text-sm text-zinc-500'>Loading your events…</div>
    );
  if (err) return <div className='py-10 text-sm text-red-500'>{err}</div>;

  const empty = rows.length === 0;

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
                    <LifecycleBadge ev={ev} />
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
                          >
                            Delete
                          </DropdownItem>
                        )}
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </>
  );
}
