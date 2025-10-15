// src/services/api.js
import { db } from '@/services/firebase';
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  getDocFromServer,
  getDoc,
  updateDoc,
  addDoc,
  setDoc,
} from 'firebase/firestore';
import {
  callStaffCascadeDeleteEvent,
  callCreatorDeleteEventSafely,
  callStaffDeleteUserCascade,
  getRole,
  callPublishEvent,
} from '@/services/cloudFunctions';
import { slugify } from '@/utils/slug';
/** Build a { [venueId]: { id, ...data } } map */
export async function getVenuesMap() {
  const snap = await getDocs(collection(db, 'venues'));
  const map = {};
  snap.forEach((d) => (map[d.id] = { id: d.id, ...d.data() }));
  return map;
}

/** Public catalogue: future + approved + published, soonest-first */
export async function getPublicEvents() {
  const nowIso = new Date().toISOString();
  const qy = query(
    collection(db, 'events'),
    where('endsAt', '>', nowIso),
    where('moderationStatus', '==', 'approved'),
    where('publishStatus', '==', 'published'),
    orderBy('endsAt', 'asc')
  );
  const snap = await getDocs(qy);
  const list = [];
  snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
  return list;
}

/** My events (creator view): all events created by me (drafts included) */
export async function getMyEvents(uid) {
  const qy = query(
    collection(db, 'events'),
    where('createdBy', '==', uid),
    orderBy('startsAt', 'desc')
  );
  const snap = await getDocs(qy);
  const list = [];
  snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
  return list;
}

/** Event read from SERVER (bypasses cache to respect latest rules) */
export async function getEventByIdServer(id) {
  const ref = doc(db, 'events', id);
  const snap = await getDocFromServer(ref); // throws permission-denied if not allowed
  return snap;
}

/** Venue read (public rules, cache read is fine) */
export async function getVenueById(id) {
  const ref = doc(db, 'venues', id);
  const snap = await getDoc(ref);
  return snap;
}

/** ---- STAFF realtime feed: all events (we sort client-side: pending first, oldest updated first) */
export function subscribeAllEventsForStaff(onEvents) {
  const ref = collection(db, 'events');
  // We subscribe to all docs staff can read; staff rules allow full read
  const unsub = onSnapshot(ref, (snap) => {
    const list = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    onEvents(list);
  });
  return unsub;
}

/** Helpers for client-side sorting */
function tsToNumber(x) {
  // Accept Firestore Timestamp, ISO string, Date, or missing
  if (!x) return 0;
  if (typeof x === 'number') return x;
  if (typeof x.toMillis === 'function') return x.toMillis(); // Firestore Timestamp
  if (typeof x === 'string') {
    const t = Date.parse(x);
    return Number.isNaN(t) ? 0 : t;
  }
  if (x instanceof Date) return x.getTime();
  return 0;
}

/** Sort: pending first; then by updatedAt asc; fallback createdAt; finally startsAt */
export function sortStaffEvents(a, b) {
  const ap = a.moderationStatus === 'pending';
  const bp = b.moderationStatus === 'pending';
  if (ap !== bp) return ap ? -1 : 1;

  const aT =
    tsToNumber(a.updatedAt) ||
    tsToNumber(a.createdAt) ||
    tsToNumber(a.startsAt);
  const bT =
    tsToNumber(b.updatedAt) ||
    tsToNumber(b.createdAt) ||
    tsToNumber(b.startsAt);

  return aT - bT;
}

/** Staff actions */
export async function deleteEventAsStaff(eventId) {
  return await callStaffCascadeDeleteEvent(eventId);
}

/** Creator-safe delete (only if not published & no orders) */
export async function deleteEventAsCreator(eventId) {
  return await callCreatorDeleteEventSafely(eventId);
}

/** Staff: cascade delete an entire user (kept for admin area) */
export async function staffDeleteUserCascade(userId) {
  return await callStaffDeleteUserCascade(userId);
}

/** Staff approve / reject (also bump updatedAt / moderatedAt) */
export async function staffApproveEvent(eventId) {
  const ref = doc(db, 'events', eventId);
  await updateDoc(ref, {
    moderationStatus: 'approved',
    moderatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function staffRejectEvent(eventId) {
  const ref = doc(db, 'events', eventId);
  await updateDoc(ref, {
    moderationStatus: 'rejected',
    moderatedAt: new Date().toISOString(),
    // Typically rejected events should NOT be public; keep publishStatus as-is, or force draft if you prefer
    // publishStatus: 'draft',
    updatedAt: new Date().toISOString(),
  });
}

export async function isStaffUser(uid) {
  return (await getRole(uid)) === 'staff';
}

export async function createEventDraft(uid, payload) {
  const now = new Date().toISOString();
  const base = {
    // permissions/ownership
    createdBy: uid,
    // lifecycle
    publishStatus: 'draft',
    moderationStatus: 'pending', // harmless while draft; will be re-set on publish
    createdAt: now,
    updatedAt: now,
    // sane defaults
    ticketsSold: 0,
    capacity: payload.capacity ?? 0,
  };
  const ref = await addDoc(collection(db, 'events'), { ...payload, ...base });
  // Return freshly read copy so caller has all server defaults
  const snap = await getDocFromServer(doc(db, 'events', ref.id));
  return { id: ref.id, ...snap.data() };
}

// --- NEW: update draft/fields (creator or staff, rules enforce) ---
export async function updateEventFields(eventId, partial) {
  await updateDoc(doc(db, 'events', eventId), {
    ...partial,
    updatedAt: new Date().toISOString(),
  });
  const snap = await getDoc(doc(db, 'events', eventId));
  return { id: eventId, ...snap.data() };
}

// --- NEW: publish (server will set moderationStatus: 'pending') ---
export async function publishEvent(eventId) {
  return await callPublishEvent(eventId);
}

// (optional) fetch for edit prefill (cache OK)
export async function getEventById(id) {
  const snap = await getDoc(doc(db, 'events', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** ---------- Categories ---------- */
export async function listCategories() {
  const snap = await getDocs(collection(db, 'categories'));
  const list = [];
  snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
  // sort by name for nicer UX
  return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

/** Create category iff slug-id is free (prevents duplicates). */
export async function createCategoryIfUnique(name) {
  const slug = slugify(name || '');
  if (!slug) throw new Error('Category name is empty.');

  const ref = doc(db, 'categories', slug);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    return { id: existing.id, ...existing.data(), _existing: true };
  }
  const data = { name: name.trim(), slug };
  await setDoc(ref, data);
  return { id: slug, ...data, _existing: false };
}

/** ---------- Venues ---------- */
export async function listVenues() {
  const snap = await getDocs(collection(db, 'venues'));
  const list = [];
  snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

/** Create venue if name (case-insensitive) not used; address may duplicate. */
export async function createVenueIfUnique({ name, address }) {
  const nameLc = (name || '').trim().toLowerCase();
  if (!nameLc) throw new Error('Venue name is required.');

  const qy = query(collection(db, 'venues'), where('name_lc', '==', nameLc));
  const snap = await getDocs(qy);
  if (!snap.empty) {
    const d = snap.docs[0];
    return { id: d.id, ...d.data(), _existing: true };
  }

  const ref = await addDoc(collection(db, 'venues'), {
    name: name.trim(),
    name_lc: nameLc,
    address: address?.line1 || '',
    city: address?.city || '',
    country: address?.countryName || '',
    lat: typeof address?.lat === 'number' ? address.lat : null,
    lng: typeof address?.lng === 'number' ? address.lng : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const d = await getDoc(ref);
  return { id: ref.id, ...d.data(), _existing: false };
}
