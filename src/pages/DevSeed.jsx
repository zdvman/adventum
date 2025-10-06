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

    // 3) Get categories back with ids
    const catsSnap = await getDocs(collection(db, 'categories'));
    // Build a map: slug -> { id, name }
    const bySlug = {};
    catsSnap.forEach((d) => {
      const data = d.data();
      bySlug[data.slug] = { id: d.id, name: data.name };
    });

    // helpers to make future dates
    const inDays = (days, hour = 19, durHours = 2) => {
      const start = new Date();
      start.setDate(start.getDate() + days);
      start.setHours(hour, 0, 0, 0);
      const end = new Date(start.getTime() + durHours * 3600 * 1000);
      return { startsAt: start.toISOString(), endsAt: end.toISOString() };
    };

    // 4) Events (published, approved, future) – extended fields
    const samples = [
      {
        title: 'Stand-up Night',
        description: 'Local comedians, friendly crowd.',
        aboutHtml: `<p>Join us for an evening of laughs with rising stars and seasoned comics.</p>`,
        image: '/images/events/standup.jpg',
        categoryId: bySlug['comedy'].id,
        categoryName: bySlug['comedy'].name,
        venueId: venueRefs[0].id,
        priceType: 'fixed',
        price: 12.5,
        currency: 'GBP',
        ticketTypes: [
          {
            id: 'early',
            name: 'Early Bird',
            price: 9.5,
            currency: 'GBP',
            available: true,
          },
          {
            id: 'std',
            name: 'Standard',
            price: 12.5,
            currency: 'GBP',
            available: true,
          },
        ],
        capacity: 120,
        ticketsSold: 22,
        refundPolicy: 'Refunds available up to 24 hours before event.',
        organizerName: 'Manchester Comedy Club',
        organizerWebsite: 'https://example.com/mcc',
        moderationStatus: 'approved',
        publishStatus: 'published',
        ...inDays(5, 20),
      },
      {
        title: 'Watercolour Workshop',
        description: 'Beginner-friendly art class.',
        aboutHtml: `<p>Learn basics of composition and color. Materials provided.</p>`,
        image: '/images/events/art.jpg',
        categoryId: bySlug['workshops'].id,
        categoryName: bySlug['workshops'].name,
        venueId: venueRefs[2].id,
        priceType: 'payWhatYouWant',
        price: null,
        currency: 'GBP',
        ticketTypes: [
          {
            id: 'don',
            name: 'Donation Ticket',
            price: null,
            currency: 'GBP',
            available: true,
          },
        ],
        capacity: 20,
        ticketsSold: 3,
        refundPolicy: 'Contact organizer for changes.',
        organizerName: 'Creative MCR',
        organizerWebsite: 'https://example.com/creative',
        moderationStatus: 'approved',
        publishStatus: 'published',
        ...inDays(9, 18, 3),
      },
      {
        title: 'JavaScript Meetup',
        description: 'Talks and pizza.',
        aboutHtml: `<p>Lightning talks + hiring updates. Bring your questions!</p>`,
        image: '/images/events/meetup.jpg',
        categoryId: bySlug['meetups'].id,
        categoryName: bySlug['meetups'].name,
        venueId: venueRefs[4].id,
        priceType: 'free',
        price: 0,
        currency: 'GBP',
        ticketTypes: [
          {
            id: 'free',
            name: 'Free RSVP',
            price: 0,
            currency: 'GBP',
            available: true,
          },
        ],
        capacity: 80,
        ticketsSold: 12,
        refundPolicy: 'Free RSVP — cancel if you can’t attend.',
        organizerName: 'JS Manchester',
        organizerWebsite: 'https://example.com/jsmcr',
        moderationStatus: 'approved',
        publishStatus: 'published',
        ...inDays(14, 19, 2),
      },
    ];

    for (const event of samples) {
      await addDoc(collection(db, 'events'), {
        ...event,
        slug: slugify(event.title),
        createdBy: user.uid,
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
