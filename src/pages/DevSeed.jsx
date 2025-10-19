// src/pages/DevSeed.jsx
import { useState } from 'react';
import { collection, addDoc, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/contexts/useAuth';
import { Heading } from '@/components/catalyst-ui-kit/heading';
import { Button } from '@/components/catalyst-ui-kit/button';
import { Text } from '@/components/catalyst-ui-kit/text';
import AlertPopup from '@/components/ui/AlertPopup';

// --- helpers ---------------------------------------------------------------
function nowIso() {
  return new Date().toISOString();
}
function lc(s) {
  return (s || '').toLowerCase();
}
function slugify(s) {
  return (s || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
function isoFromOffset({ days = 0, hours = 0 }) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(d.getHours() + hours, 0, 0, 0);
  return d.toISOString();
}
function makeWindow(kind) {
  // kind: 'past' | 'live' | 'future'
  // Past: ended yesterday, Future: starts in 7+ days, Live: now -1h .. now + 2h
  if (kind === 'past') {
    const startsAt = isoFromOffset({ days: -14, hours: 18 });
    const endsAt = isoFromOffset({ days: -14, hours: 22 });
    return { startsAt, endsAt };
  }
  if (kind === 'live') {
    const startsAt = isoFromOffset({ hours: -1 });
    const endsAt = isoFromOffset({ hours: 2 });
    return { startsAt, endsAt };
  }
  // future (default)
  const startsAt = isoFromOffset({ days: 7, hours: 19 });
  const endsAt = isoFromOffset({ days: 7, hours: 22 });
  return { startsAt, endsAt };
}

// Idempotent upserts (read-all-then-match on client)
async function loadAll(collectionName) {
  const snap = await getDocs(collection(db, collectionName));
  const items = [];
  snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
  return items;
}

async function ensureCategories(list) {
  const existing = await loadAll('categories');
  const bySlug = new Map(
    existing.map((c) => [lc(c.slug || c.name_lc || slugify(c.name)), c])
  );
  const ensured = [];

  for (const c of list) {
    const slug = c.slug || slugify(c.name);
    const key = lc(slug);
    const found = bySlug.get(key);
    if (found) {
      ensured.push({ id: found.id, name: found.name, slug: found.slug });
      continue;
    }
    const payload = {
      name: c.name,
      name_lc: lc(c.name),
      slug,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const ref = await addDoc(collection(db, 'categories'), payload);
    ensured.push({ id: ref.id, name: c.name, slug });
  }
  return ensured; // array of {id, name, slug}
}

async function ensureVenues(list) {
  const existing = await loadAll('venues');
  const byKey = new Map(
    existing.map((v) => [`${lc(v.name_lc || v.name)}|${lc(v.city)}`, v])
  );
  const ensured = [];

  for (const v of list) {
    const key = `${lc(v.name)}|${lc(v.city)}`;
    const found = byKey.get(key);
    if (found) {
      ensured.push({ id: found.id, ...found });
      continue;
    }
    const payload = {
      name: v.name,
      name_lc: lc(v.name),
      address: v.address,
      city: v.city,
      country: v.country,
      lat: v.lat,
      lng: v.lng,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const ref = await addDoc(collection(db, 'venues'), payload);
    ensured.push({ id: ref.id, ...payload });
  }
  return ensured; // array of full venue docs (incl id)
}

async function getExistingEventSlugs() {
  const all = await loadAll('events');
  const set = new Set();
  all.forEach((e) => {
    if (e.slug) set.add(lc(e.slug));
    else set.add(lc(slugify(e.title || '')));
  });
  return set;
}

// --- page ------------------------------------------------------------------
export default function DevSeed() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('Done');
  const [alertMsg, setAlertMsg] = useState('');

  async function run() {
    if (!user) {
      setAlertTitle('Sign in required');
      setAlertMsg('Please sign in first.');
      setAlertOpen(true);
      return;
    }
    if (profile?.role !== 'staff') {
      setAlertTitle('Staff only');
      setAlertMsg(
        'You must be a staff user to seed data. Set profile.role to "staff" in Firestore and try again.'
      );
      setAlertOpen(true);
      return;
    }

    setLoading(true);
    try {
      // 1) Categories (will reuse existing)
      const categoriesToEnsure = [
        // your existing ones (kept stable)
        { name: 'Food & Drink • Food', slug: 'food-drink-food' },
        { name: 'Food & Drink • Spirits', slug: 'food-drink-spirits' },
        { name: 'Arts • Comedy', slug: 'arts-comedy' },
        { name: 'Health • Mental health', slug: 'health-mental-health' },
        // a few extra useful buckets
        { name: 'Music • Live', slug: 'music-live' },
        { name: 'Technology • Meetups', slug: 'technology-meetups' },
        { name: 'Workshops • Art', slug: 'workshops-art' },
      ];
      const cats = await ensureCategories(categoriesToEnsure);
      const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c]));

      // 2) Venues (UK-centric examples; will reuse existing “Venue 28”)
      const venuesToEnsure = [
        {
          name: 'Venue 28',
          address: 'Beckenham Road',
          city: 'London',
          country: 'United Kingdom',
          lat: 51.4088184,
          lng: -0.0402323,
        },
        {
          name: 'The Comedy Store',
          address: 'Arches 3 & 4, Deansgate Locks',
          city: 'Manchester',
          country: 'United Kingdom',
          lat: 53.4732,
          lng: -2.2529,
        },
        {
          name: 'Albert Hall',
          address: '27 Peter St',
          city: 'Manchester',
          country: 'United Kingdom',
          lat: 53.4787,
          lng: -2.2475,
        },
        {
          name: 'Royal Exchange Theatre',
          address: 'St Ann’s Square',
          city: 'Manchester',
          country: 'United Kingdom',
          lat: 53.4826,
          lng: -2.2445,
        },
        {
          name: 'Oval Space',
          address: '29–32 The Oval',
          city: 'London',
          country: 'United Kingdom',
          lat: 51.5332,
          lng: -0.0572,
        },
        {
          name: 'The Forge',
          address: '12 Chalk Farm Rd',
          city: 'London',
          country: 'United Kingdom',
          lat: 51.5444,
          lng: -0.1488,
        },
      ];
      const venues = await ensureVenues(venuesToEnsure);
      const venueByNameCity = Object.fromEntries(
        venues.map((v) => [`${lc(v.name)}|${lc(v.city)}`, v])
      );

      // 3) Plan a broad set of events (statuses, time windows, price models)
      const make = (p) => {
        const { startsAt, endsAt } = makeWindow(p.when);
        const cat = catBySlug[p.categorySlug];
        const v =
          venueByNameCity[`${lc(p.venueName)}|${lc(p.venueCity)}`] || venues[0]; // fallback
        const base = {
          title: p.title,
          slug: slugify(p.title),
          description: p.description,
          aboutHtml: p.aboutHtml,
          image: p.image,
          categoryId: cat.id,
          categoryName: cat.name,
          venueId: v.id,
          priceType: p.priceType,
          price: p.price,
          currency: 'GBP',
          ticketTypes: [], // kept simple (your screenshots show empty arrays)
          capacity: p.capacity,
          ticketsSold: p.ticketsSold,
          organizerName: p.organizerName,
          organizerWebsite: p.organizerWebsite,
          moderationStatus: p.moderationStatus, // 'approved' | 'pending' | 'rejected'
          publishStatus: p.publishStatus, // 'published' | 'draft'
          startsAt,
          endsAt,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          submittedAt: nowIso(),
          createdBy: user.uid,
        };
        return base;
      };

      // image URLs are public (unsplash) just for dev/demo
      const IMG = {
        food: 'https://images.unsplash.com/photo-1543352634-8730b1ebfe5a?q=80&w=1400&auto=format&fit=crop',
        spirits:
          'https://images.unsplash.com/photo-1604909052743-1b3c7a56a0ab?q=80&w=1400&auto=format&fit=crop',
        comedy:
          'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1400&auto=format&fit=crop',
        health:
          'https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=1400&auto=format&fit=crop',
        music:
          'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1400&auto=format&fit=crop',
        tech: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1400&auto=format&fit=crop',
        art: 'https://images.unsplash.com/photo-1523755231516-e43fd2e8dca5?q=80&w=1400&auto=format&fit=crop',
      };

      const commonOrg = {
        organizerName: 'Adventum Events',
        organizerWebsite: 'https://example.com/adventum',
      };

      const plans = [
        // PUBLISHED × APPROVED
        {
          ...commonOrg,
          title: 'Comedy Night – Headliners Special',
          description: 'Big-laugh lineup with touring comics.',
          aboutHtml:
            '<p>Join us for a packed bill of stand-up headliners. Doors 19:00.</p>',
          image: IMG.comedy,
          categorySlug: 'arts-comedy',
          venueName: 'The Comedy Store',
          venueCity: 'Manchester',
          priceType: 'fixed',
          price: 18,
          capacity: 250,
          ticketsSold: 250, // sold out
          moderationStatus: 'approved',
          publishStatus: 'published',
          when: 'future',
        },
        {
          ...commonOrg,
          title: 'Open-Air Live Music',
          description: 'Indie + acoustic sets.',
          aboutHtml: '<p>Outdoor stage, covered area available if raining.</p>',
          image: IMG.music,
          categorySlug: 'music-live',
          venueName: 'Albert Hall',
          venueCity: 'Manchester',
          priceType: 'free',
          price: 0,
          capacity: 800,
          ticketsSold: 400, // half
          moderationStatus: 'approved',
          publishStatus: 'published',
          when: 'live',
        },
        {
          ...commonOrg,
          title: 'Community Wellbeing Session',
          description: 'Mindfulness and light movement.',
          aboutHtml:
            '<p>Bring a mat and water. Suitable for beginners and all ages 16+.</p>',
          image: IMG.health,
          categorySlug: 'health-mental-health',
          venueName: 'Venue 28',
          venueCity: 'London',
          priceType: 'payWhatYouWant',
          price: 0,
          capacity: 60,
          ticketsSold: 58, // near sold
          moderationStatus: 'approved',
          publishStatus: 'published',
          when: 'past',
        },

        // PUBLISHED × PENDING
        {
          ...commonOrg,
          title: 'Spirits Tasting Evening',
          description: 'Craft gin and small-batch whisky.',
          aboutHtml:
            '<p>Sample 12+ spirits with expert guidance. ID required (18+).</p>',
          image: IMG.spirits,
          categorySlug: 'food-drink-spirits',
          venueName: 'Oval Space',
          venueCity: 'London',
          priceType: 'fixed',
          price: 35,
          capacity: 120,
          ticketsSold: 0, // new
          moderationStatus: 'pending',
          publishStatus: 'published',
          when: 'future',
        },
        {
          ...commonOrg,
          title: 'City Tech Meetup',
          description: 'Lightning talks, pizza, and jobs board.',
          aboutHtml:
            '<p>Short talks (10–15 min), Q&A, and plenty of networking.</p>',
          image: IMG.tech,
          categorySlug: 'technology-meetups',
          venueName: 'Royal Exchange Theatre',
          venueCity: 'Manchester',
          priceType: 'free',
          price: 0,
          capacity: 200,
          ticketsSold: 20,
          moderationStatus: 'pending',
          publishStatus: 'published',
          when: 'live',
        },
        {
          ...commonOrg,
          title: 'Farm-to-Table Street Food Fair',
          description: 'Local vendors + live demos.',
          aboutHtml:
            '<p>Family-friendly food fair. Vegan/vegetarian options available.</p>',
          image: IMG.food,
          categorySlug: 'food-drink-food',
          venueName: 'Oval Space',
          venueCity: 'London',
          priceType: 'payWhatYouWant',
          price: 0,
          capacity: 500,
          ticketsSold: 120,
          moderationStatus: 'pending',
          publishStatus: 'published',
          when: 'past',
        },

        // PUBLISHED × REJECTED (edge case to test UI)
        {
          ...commonOrg,
          title: 'Late Night Underground Party',
          description: 'DJ sets till late.',
          aboutHtml:
            '<p>Strict capacity. House/techno. Earplugs available on request.</p>',
          image: IMG.music,
          categorySlug: 'music-live',
          venueName: 'The Forge',
          venueCity: 'London',
          priceType: 'fixed',
          price: 22,
          capacity: 300,
          ticketsSold: 75,
          moderationStatus: 'rejected',
          publishStatus: 'published',
          when: 'future',
        },

        // DRAFT × APPROVED
        {
          ...commonOrg,
          title: 'Printmaking Workshop (Beginners)',
          description: 'Hands-on session with materials included.',
          aboutHtml:
            '<p>Learn basic relief printmaking techniques and take home your work.</p>',
          image: IMG.art,
          categorySlug: 'workshops-art',
          venueName: 'Royal Exchange Theatre',
          venueCity: 'Manchester',
          priceType: 'fixed',
          price: 28,
          capacity: 18,
          ticketsSold: 9,
          moderationStatus: 'approved',
          publishStatus: 'draft',
          when: 'future',
        },
        {
          ...commonOrg,
          title: 'Healthy Habits Mini-Retreat',
          description: 'Half-day reset with guided practices.',
          aboutHtml:
            '<p>Journaling, breathwork, and simple routines you can keep.</p>',
          image: IMG.health,
          categorySlug: 'health-mental-health',
          venueName: 'Venue 28',
          venueCity: 'London',
          priceType: 'payWhatYouWant',
          price: 0,
          capacity: 40,
          ticketsSold: 0,
          moderationStatus: 'approved',
          publishStatus: 'draft',
          when: 'past',
        },

        // DRAFT × PENDING
        {
          ...commonOrg,
          title: 'Comedy Open Mic (New Material Night)',
          description: 'Friendly room for new jokes.',
          aboutHtml:
            '<p>5–7 min spots. Arrive early to sign up. No heckling please.</p>',
          image: IMG.comedy,
          categorySlug: 'arts-comedy',
          venueName: 'The Comedy Store',
          venueCity: 'Manchester',
          priceType: 'free',
          price: 0,
          capacity: 90,
          ticketsSold: 0,
          moderationStatus: 'pending',
          publishStatus: 'draft',
          when: 'future',
        },

        // DRAFT × REJECTED
        {
          ...commonOrg,
          title: 'Pop-Up Spirits Fair (After Hours)',
          description: 'Limited release tasting.',
          aboutHtml:
            '<p>Exclusive small-batch tastings. Limited admission.</p>',
          image: IMG.spirits,
          categorySlug: 'food-drink-spirits',
          venueName: 'Oval Space',
          venueCity: 'London',
          priceType: 'fixed',
          price: 45,
          capacity: 100,
          ticketsSold: 0,
          moderationStatus: 'rejected',
          publishStatus: 'draft',
          when: 'future',
        },

        // Additional diversity (sold-out free event, half-sold fixed, etc.)
        {
          ...commonOrg,
          title: 'Neighborhood Food Market',
          description: 'Street food, producers, and live demos.',
          aboutHtml: '<p>Free entry, all welcome. Family friendly.</p>',
          image: IMG.food,
          categorySlug: 'food-drink-food',
          venueName: 'Venue 28',
          venueCity: 'London',
          priceType: 'free',
          price: 0,
          capacity: 1000,
          ticketsSold: 1000, // sold out
          moderationStatus: 'approved',
          publishStatus: 'published',
          when: 'future',
        },
        {
          ...commonOrg,
          title: 'AI & Product Meetup',
          description: 'Talks on practical AI with demos.',
          aboutHtml:
            '<p>Short talks from practitioners, followed by Q&A and networking.</p>',
          image: IMG.tech,
          categorySlug: 'technology-meetups',
          venueName: 'Albert Hall',
          venueCity: 'Manchester',
          priceType: 'fixed',
          price: 12,
          capacity: 220,
          ticketsSold: 110, // half
          moderationStatus: 'approved',
          publishStatus: 'published',
          when: 'future',
        },
      ].map(make);

      // 4) Write events (skip if slug already present)
      const existingSlugs = await getExistingEventSlugs();
      let createdCount = 0;
      for (const ev of plans) {
        const k = lc(ev.slug);
        if (existingSlugs.has(k)) continue; // idempotent
        // Use setDoc with generated id to keep fields exactly as we send
        const ref = doc(collection(db, 'events'));
        await setDoc(ref, ev);
        createdCount++;
      }

      setAlertTitle('Seeding complete');
      setAlertMsg(
        `Categories ensured: ${categoriesToEnsure.length}
Venues ensured: ${venuesToEnsure.length}
Events created: ${createdCount}
(If 0 events were created, they may already exist — this is expected on re-runs.)`
      );
      setAlertOpen(true);
    } catch (err) {
      console.error('Dev seed error:', err);
      setAlertTitle('Seeding failed');
      setAlertMsg(err?.message || 'Unexpected error while seeding.');
      setAlertOpen(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='mx-auto max-w-2xl p-6'>
      <Heading>Development Seeder</Heading>
      <Text className='mt-2 text-zinc-400'>
        Creates categories, venues, and a broad set of events covering every
        status/price/date combination. You must be signed in as{' '}
        <strong>staff</strong>. Rerunnable without duplication.
      </Text>

      <Button onClick={run} className='mt-6' color='indigo' disabled={loading}>
        {loading ? 'Seeding…' : 'Seed sample data'}
      </Button>

      <AlertPopup
        isOpen={alertOpen}
        setIsOpen={setAlertOpen}
        title={alertTitle}
        description={alertMsg}
        confirmText='OK'
      />
    </div>
  );
}
