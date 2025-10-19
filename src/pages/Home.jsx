// src/pages/Home.jsx
import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '@/contexts/useAuth';
import { listPublicEvents } from '@/services/api';

import Loading from '@/components/ui/Loading';
import AlertPopup from '@/components/ui/AlertPopup';

import { Button } from '@/components/catalyst-ui-kit/button';
import { Heading, Subheading } from '@/components/catalyst-ui-kit/heading';

import {
  CalendarIcon,
  CreditCardIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

function formatRange(startsAt, endsAt) {
  if (!startsAt) return 'TBA';
  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : null;

  const date = start.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });

  const timeStart = start.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (!end) return `${date} · ${timeStart}`;

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  const timeEnd = end.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (sameDay) return `${date} · ${timeStart}–${timeEnd}`;

  const dateEnd = end.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
  return `${date} · ${timeStart} → ${dateEnd} · ${timeEnd}`;
}

function Feature({ icon: Icon, title, desc }) {
  return (
    <div className='flex items-start gap-3 rounded-xl border border-white/10 bg-zinc-900/30 p-4'>
      <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10'>
        <Icon className='size-5 text-indigo-400' />
      </div>
      <div>
        <div className='font-medium text-zinc-100'>{title}</div>
        <div className='mt-1 text-sm text-zinc-400'>{desc}</div>
      </div>
    </div>
  );
}

function EventCard({ ev }) {
  const remaining = Math.max(0, (ev.capacity || 0) - (ev.ticketsSold || 0));
  return (
    <Link
      to={`/events/${ev.id}`}
      className='group overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40 hover:border-indigo-400/40'
      title={ev.title || 'Event'}
    >
      <div className='aspect-[16/9] w-full overflow-hidden bg-zinc-800'>
        {ev.image ? (
          <img
            src={ev.image}
            alt=''
            className='size-full object-cover transition duration-300 group-hover:scale-105'
            loading='lazy'
          />
        ) : (
          <div className='grid size-full place-items-center text-sm text-zinc-500'>
            No image
          </div>
        )}
      </div>
      <div className='p-4'>
        <div className='text-xs text-zinc-400'>
          {formatRange(ev.startsAt, ev.endsAt)}
        </div>
        <div className='mt-1 line-clamp-2 font-medium text-zinc-100'>
          {ev.title || 'Untitled event'}
        </div>
        {ev.categoryName ? (
          <div className='mt-1 text-xs text-zinc-400'>{ev.categoryName}</div>
        ) : null}
        <div className='mt-2 text-xs'>
          {remaining > 0 ? (
            <span className='text-emerald-400'>{remaining} spots left</span>
          ) : (
            <span className='text-amber-400'>Waitlist / full</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { profile } = useAuth(); // role-based CTA
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // AlertPopup state
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('Something went wrong');
  const [alertMessage, setAlertMessage] = useState('Please try again.');
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      try {
        const list = await listPublicEvents({ limitTo: 6 });
        if (alive) setEvents(list || []);
      } catch (e) {
        // Surface with AlertPopup
        setAlertTitle('Failed to load events');
        setAlertMessage(e?.message || 'Please try again.');
        setIsAlertOpen(true);
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [reloadTick]);

  const isStaff = useMemo(() => profile?.role === 'staff', [profile?.role]);

  return (
    <div className='pb-16'>
      {/* Hero */}
      <section className='relative isolate overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(80rem_60rem_at_10%_-10%,rgba(79,70,229,.25),transparent),radial-gradient(80rem_60rem_at_110%_10%,rgba(147,51,234,.2),transparent)] p-8 sm:p-12'>
        <div className='mx-auto max-w-3xl text-center'>
          <Heading as='h1'>Discover. Sign up. Show up.</Heading>
          <p className='mt-3 text-balance text-zinc-300'>
            A simple community events platform. Browse upcoming events, reserve
            your spot, and add them to your calendar in one click.
          </p>
          <div className='mt-6 flex flex-wrap items-center justify-center gap-3'>
            <Button href='/events' color='indigo'>
              Find Events
            </Button>
            {isStaff ? (
              <Button href='/events/new' color='zinc' outline>
                Create Event
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {/* 3 quick benefits */}
      <section className='mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <Feature
          icon={UsersIcon}
          title='Easy sign-ups'
          desc='Reserve a spot for free or paid events in seconds.'
        />
        <Feature
          icon={CalendarIcon}
          title='Add to Google Calendar'
          desc='One click from event page to your personal calendar.'
        />
        <Feature
          icon={CreditCardIcon}
          title='Flexible pricing'
          desc='Free, fixed price, or pay-what-you-want events supported.'
        />
      </section>

      {/* Upcoming events */}
      <section className='mt-12'>
        <div className='flex items-end justify-between'>
          <div>
            <Subheading>Upcoming events</Subheading>
            <p className='mt-1 text-sm text-zinc-400'>
              Hand-picked highlights from the community.
            </p>
          </div>
          <Button href='/events' color='zinc' outline>
            View all
          </Button>
        </div>

        {loading ? (
          <div className='mt-6'>
            <Loading label='Loading events…' />
          </div>
        ) : events.length === 0 ? (
          <div className='mt-6 rounded-xl border border-white/10 p-6 text-sm text-zinc-400'>
            No upcoming events yet. Check back soon!
          </div>
        ) : (
          <div className='mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {events.map((ev) => (
              <EventCard key={ev.id} ev={ev} />
            ))}
          </div>
        )}
      </section>

      {/* Error popup */}
      <AlertPopup
        isOpen={isAlertOpen}
        setIsOpen={setIsAlertOpen}
        title={alertTitle}
        description={alertMessage}
        confirmText='Try again'
        cancelText='Close'
        onConfirm={() => setReloadTick((t) => t + 1)}
      />
    </div>
  );
}
