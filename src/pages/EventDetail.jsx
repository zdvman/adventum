import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { composeIdSlug, splitIdSlug } from '@/utils/slug';

// (Optional) replace with Catalyst components you want to use
import { Heading } from '@/components/catalyst-ui-kit/heading';
import { Badge } from '@/components/catalyst-ui-kit/badge';
import { Divider } from '@/components/catalyst-ui-kit/divider';

export default function EventDetail() {
  // ---- hooks are always called (no conditionals)
  const params = useParams();
  const navigate = useNavigate();

  // derive id from URL param
  const idSlug = params.idSlug ?? '';
  const { id } = useMemo(() => splitIdSlug(idSlug), [idSlug]);

  // local state
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  // fetch event by id
  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      try {
        if (!id) {
          // malformed URL -> 404
          navigate('/not-found', { replace: true });
          return;
        }

        const snap = await getDoc(doc(db, 'events', id));
        if (!snap.exists()) {
          navigate('/not-found', { replace: true });
          return;
        }

        const data = { id: snap.id, ...snap.data() };
        if (ignore) return;

        setEvent(data);

        // Normalize URL if title changed or slug missing
        const canonical = `/events/${composeIdSlug(data.id, data.title)}`;
        if (location.pathname !== canonical) {
          navigate(canonical, { replace: true });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [id, navigate]);

  if (loading) return <div className='p-4 text-sm text-zinc-500'>Loading…</div>;
  if (!event) return null;

  // ---- Render (swap for your Catalyst layout)
  return (
    <div className='space-y-6'>
      <header className='flex items-start gap-4'>
        <img
          src={event.image}
          alt={event.title}
          className='h-28 w-40 rounded-lg object-cover shadow-sm'
        />
        <div className='flex-1'>
          <Heading>{event.title}</Heading>
          <p className='mt-1 text-sm text-zinc-500'>
            {event.categoryName ?? event.categoryId} ·{' '}
            {event.priceType === 'free'
              ? 'Free'
              : `${event.price} ${event.currency}`}
          </p>
          <div className='mt-2 flex flex-wrap gap-2'>
            <Badge
              color={event.publishStatus === 'published' ? 'lime' : 'zinc'}
            >
              {event.publishStatus === 'published' ? 'Published' : 'Draft'}
            </Badge>
            <Badge
              color={event.moderationStatus === 'approved' ? 'sky' : 'zinc'}
            >
              {event.moderationStatus}
            </Badge>
          </div>
        </div>
      </header>

      <Divider soft />

      <section className='space-y-2'>
        <h2 className='text-sm font-semibold text-zinc-300'>About</h2>
        <p className='text-sm text-zinc-400'>{event.description}</p>
      </section>

      <Divider soft />

      <section className='grid gap-4 sm:grid-cols-2'>
        <div className='rounded-lg bg-white/5 p-4 ring-1 ring-white/10'>
          <h3 className='text-sm font-semibold text-zinc-300'>When</h3>
          <p className='mt-1 text-sm text-zinc-400'>
            {new Date(event.start).toLocaleString()} –{' '}
            {new Date(event.end).toLocaleString()} ({event.timezone})
          </p>
        </div>

        <div className='rounded-lg bg-white/5 p-4 ring-1 ring-white/10'>
          <h3 className='text-sm font-semibold text-zinc-300'>Tickets</h3>
          <p className='mt-1 text-sm text-zinc-400'>
            {event.ticketsAvailable}/{event.capacity} available
          </p>
        </div>
      </section>
    </div>
  );
}
