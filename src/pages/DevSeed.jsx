// src/pages/DevSeed.jsx
import { db } from '@/services/firebase';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { useAuth } from '@/contexts/useAuth';

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function DevSeed() {
  const { user, profile } = useAuth();

  async function run() {
    if (!user) {
      alert('Please sign in first.');
      return;
    }
    if (profile?.role !== 'staff') {
      alert(
        'You must be a staff user to seed data. Edit your profile.role to "staff" in Firestore and try again.'
      );
      return;
    }

    // 1) Categories
    const categories = [
      { name: 'Comedy', slug: 'comedy' },
      { name: 'Workshops', slug: 'workshops' },
      { name: 'Meetups', slug: 'meetups' },
    ];
    for (const c of categories) {
      await addDoc(collection(db, 'categories'), c);
    }

    // 2) Venues (Manchester examples)
    const venues = [
      {
        name: 'The Comedy Store',
        address: 'Arches 3 & 4, Deansgate Locks',
        city: 'Manchester',
        country: 'UK',
        lat: 53.4732,
        lng: -2.2529,
      },
      {
        name: 'Albert Hall',
        address: '27 Peter St',
        city: 'Manchester',
        country: 'UK',
        lat: 53.4787,
        lng: -2.2475,
      },
      {
        name: 'Gorilla',
        address: '54-56 Whitworth St',
        city: 'Manchester',
        country: 'UK',
        lat: 53.4747,
        lng: -2.2425,
      },
      {
        name: 'Royal Exchange Theatre',
        address: 'St Ann’s Square',
        city: 'Manchester',
        country: 'UK',
        lat: 53.4826,
        lng: -2.2445,
      },
      {
        name: 'YES Manchester',
        address: '38 Charles St',
        city: 'Manchester',
        country: 'UK',
        lat: 53.4742,
        lng: -2.2368,
      },
    ];
    const venueRefs = [];
    for (const v of venues) {
      const ref = await addDoc(collection(db, 'venues'), v);
      venueRefs.push({ id: ref.id, ...v });
    }

    // 3) Get category ids
    const catsSnap = await getDocs(collection(db, 'categories'));
    const bySlug = {};
    catsSnap.forEach((d) => (bySlug[d.data().slug] = d.id));

    // helpers to make future dates
    const inDays = (days, hour = 19, durHours = 2) => {
      const start = new Date();
      start.setDate(start.getDate() + days);
      start.setHours(hour, 0, 0, 0);
      const end = new Date(start.getTime() + durHours * 3600 * 1000);
      return { startsAt: start.toISOString(), endsAt: end.toISOString() };
    };

    // 4) Events (published, approved, future)
    const samples = [
      {
        title: 'Stand-up Night',
        description: 'Local comedians, friendly crowd.',
        image: '/images/events/standup.jpg',
        categoryId: bySlug['comedy'],
        venueId: venueRefs[0].id,
        priceType: 'fixed',
        price: 12.5,
        currency: 'GBP',
        capacity: 120,
        ticketsSold: 22,
        moderationStatus: 'approved',
        publishStatus: 'published',
        ...inDays(5, 20),
      },
      {
        title: 'Watercolour Workshop',
        description: 'Beginner-friendly art class.',
        image: '/images/events/art.jpg',
        categoryId: bySlug['workshops'],
        venueId: venueRefs[2].id,
        priceType: 'payWhatYouWant',
        price: null,
        currency: 'GBP',
        capacity: 20,
        ticketsSold: 3,
        moderationStatus: 'approved',
        publishStatus: 'published',
        ...inDays(9, 18, 3),
      },
      {
        title: 'JavaScript Meetup',
        description: 'Talks and pizza.',
        image: '/images/events/meetup.jpg',
        categoryId: bySlug['meetups'],
        venueId: venueRefs[4].id,
        priceType: 'free',
        price: 0,
        currency: 'GBP',
        capacity: 80,
        ticketsSold: 12,
        moderationStatus: 'approved',
        publishStatus: 'published',
        ...inDays(14, 19, 2),
      },
    ];

    for (const e of samples) {
      await addDoc(collection(db, 'events'), {
        ...e,
        slug: slugify(e.title),
        createdBy: user.uid, // from AuthContext shape
      });
    }

    alert('Seeded! Check Firestore → categories / venues / events.');
  }

  return (
    <div className='p-6'>
      <p className='mb-4 text-sm text-zinc-600'>
        You must be signed in as <strong>staff</strong> to seed data.
      </p>
      <button
        onClick={run}
        className='rounded-lg bg-blue-600 px-4 py-2 text-white'
      >
        Seed sample data
      </button>
    </div>
  );
}
