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
import { TextLink } from '@/components/catalyst-ui-kit/text';
import {
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/16/solid';
import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// export const metadata = {
//   title: 'Events',
// };

export default function EventsIndex() {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    async function getEvents() {
      try {
        const res = await fetch(`${API_BASE}/events`);
        if (!res.ok) throw new Error('Failed to connect to server');
        const data = await res.json();
        // console.log(data);
        if (!data.length) throw new Error('No events in the list');
        setEvents(data);
      } catch (err) {
        console.error(err.message);
      } finally {
        console.log(events);
      }
    }
    getEvents();
  }, []);

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
        <Button>Create event</Button>
      </div>
      <ul className='mt-10'>
        {events.map((event, index) => (
          <li key={event.id}>
            <Divider soft={index > 0} />
            <div className='flex items-center justify-between'>
              <div key={event.id} className='flex gap-6 py-6'>
                <div className='w-32 shrink-0'>
                  <Link href={event.url} aria-hidden='true'>
                    <img
                      className='aspect-3/2 rounded-lg shadow-sm'
                      src={event.image}
                      alt=''
                    />
                  </Link>
                </div>
                <div className='space-y-1.5'>
                  <div className='text-base/6 font-semibold'>
                    <TextLink href={`/events/${event.slug}`}>
                      {event.title}
                    </TextLink>
                  </div>
                  <div className='text-xs/6 text-zinc-500'>
                    {event.date} at {event.time}{' '}
                    <span aria-hidden='true'>·</span> {event.location}
                  </div>
                  <div className='text-xs/6 text-zinc-600'>
                    {event.ticketsSold}/{event.ticketsAvailable} tickets sold
                  </div>
                </div>
              </div>
              <div className='flex items-center gap-4'>
                <Badge
                  className='max-sm:hidden'
                  color={event.status === 'On Sale' ? 'lime' : 'zinc'}
                >
                  {event.status}
                </Badge>
                <Dropdown>
                  <DropdownButton plain aria-label='More options'>
                    <EllipsisVerticalIcon />
                  </DropdownButton>
                  <DropdownMenu anchor='bottom end'>
                    <DropdownItem href={event.url}>View</DropdownItem>
                    <DropdownItem>Edit</DropdownItem>
                    <DropdownItem>Delete</DropdownItem>
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
