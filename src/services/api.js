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
  limit,
} from 'firebase/firestore';
import {
  callStaffCascadeDeleteEvent,
  callCreatorDeleteEventSafely,
  callStaffDeleteUserCascade,
  getRole,
  callPublishEvent,
  callSetPublishStatus,
  callStaffSetUserBlocked,
  callStaffSetUserRole,
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

/** Public catalogue: ALL approved + published (past + future), sorted by startsAt asc */
export async function getPublicEventsAll() {
  const qy = query(
    collection(db, 'events'),
    where('moderationStatus', '==', 'approved'),
    where('publishStatus', '==', 'published'),
    orderBy('startsAt', 'asc')
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

/** Sort: pending first; then by updatedAt DESC (newest first); fallback createdAt; startsAt */
export function sortStaffEventsNewest(a, b) {
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

  return bT - aT; // DESC
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
    updatedAt: new Date().toISOString(),
  });
}

export async function isStaffUser(uid) {
  return (await getRole(uid)) === 'staff';
}

export async function createEventDraft(uid, payload) {
  const now = new Date().toISOString();
  const base = {
    createdBy: uid,
    publishStatus: 'draft', // draft only
    moderationStatus: null, // <- NOT pending for drafts
    createdAt: now,
    updatedAt: now,
    ticketsSold: 0,
    capacity: payload.capacity ?? 0,
  };
  const ref = await addDoc(collection(db, 'events'), { ...payload, ...base });
  const snap = await getDocFromServer(doc(db, 'events', ref.id));
  return { id: ref.id, ...snap.data() };
}

// Update fields; optionally force draft while keeping moderationStatus unchanged
export async function updateEventFields(eventId, partial, opts = {}) {
  const { keepPublished = true } = opts;
  const update = {
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  if (!keepPublished) {
    update.publishStatus = 'draft';
    // DO NOT touch moderationStatus (per requirement)
  }
  await updateDoc(doc(db, 'events', eventId), update);
  const snap = await getDoc(doc(db, 'events', eventId));
  return { id: eventId, ...snap.data() };
}

export async function publishEvent(eventId) {
  return await callPublishEvent(eventId);
}

// Toggle publish via Cloud Function so moderation is computed server-side
export async function setPublishStatus(eventId, isPublished) {
  const res = await callSetPublishStatus(eventId, !!isPublished);
  // Cloud Function returns: { publishStatus, moderationStatus }
  return {
    ok: true,
    publishStatus: res.publishStatus,
    moderationStatus: res.moderationStatus ?? null,
  };
}

export async function getEventById(id) {
  const snap = await getDoc(doc(db, 'events', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** ---------- Categories (auto-ID, de-duped by slug) ---------- */
export async function listCategories() {
  const snap = await getDocs(collection(db, 'categories'));
  const bySlug = new Map();
  snap.forEach((d) => {
    const data = { id: d.id, ...d.data() };
    const k = (data.slug || '').trim().toLowerCase();
    if (k && !bySlug.has(k)) bySlug.set(k, data);
  });
  const list = Array.from(bySlug.values());
  return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

export async function createCategoryIfUnique(name) {
  const trimmed = (name || '').trim();
  const slug = slugify(trimmed);
  if (!slug) throw new Error('Category name is empty.');

  const qy = query(collection(db, 'categories'), where('slug', '==', slug));
  const snap = await getDocs(qy);
  if (!snap.empty) {
    const d = snap.docs[0];
    return { id: d.id, ...d.data(), _existing: true };
  }

  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, 'categories'), {
    name: trimmed,
    slug,
    name_lc: trimmed.toLowerCase(),
    createdAt: now,
    updatedAt: now,
  });

  const d = await getDoc(ref);
  return { id: ref.id, ...d.data(), _existing: false };
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

export async function listPublicEvents({ limitTo = 50 } = {}) {
  const q = query(
    collection(db, 'events'),
    where('publishStatus', '==', 'published'),
    where('moderationStatus', '==', 'approved'),
    orderBy('startsAt', 'asc'),
    limit(limitTo)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getEventForPublic(eventId, currentUserId = null) {
  const ref = doc(db, 'events', eventId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = { id: snap.id, ...snap.data() };

  // Public can see only approved+published
  const isOwner = currentUserId && data.createdBy === currentUserId;
  const staff = data.__viewerIsStaff === true; // or however you detect staff/admin
  const isApprovedPublic =
    data.publishStatus === 'published' && data.moderationStatus === 'approved';

  if (isApprovedPublic || isOwner || staff) return data;

  // otherwise hide
  return null;
}

// Read any user's profile (for staff view)
export async function getProfileById(uid, { fromServer = true } = {}) {
  const ref = doc(db, 'profiles', uid);
  const snap = fromServer ? await getDocFromServer(ref) : await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Staff can update safe fields directly (rules allow it)
export async function staffUpdateUserProfile(uid, partial) {
  await updateDoc(doc(db, 'profiles', uid), {
    ...partial,
    updatedAt: new Date().toISOString(),
  });
}

// Staff role change
export async function staffSetUserRole(uid, role) {
  const res = await callStaffSetUserRole(uid, role);
  return res;
}

// Staff block/unblock
export async function staffSetUserBlocked(uid, blocked) {
  const res = await callStaffSetUserBlocked(uid, blocked);
  return res;
}

// --- STAFF: realtime list of all profiles
export function subscribeAllProfilesForStaff(onProfiles) {
  const ref = collection(db, 'profiles');
  const unsub = onSnapshot(ref, (snap) => {
    const list = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    onProfiles(list);
  });
  return unsub;
}

// --- STAFF: profile sorting (blocked first, then role=staff, then recent update)
export function sortStaffProfiles(a, b) {
  const ab = !!a.blocked;
  const bb = !!b.blocked;
  if (ab !== bb) return ab ? -1 : 1;

  const ar = a.role === 'staff';
  const br = b.role === 'staff';
  if (ar !== br) return ar ? -1 : 1;

  const at = tsToNumber(a.updatedAt) || tsToNumber(a.createdAt) || 0;
  const bt = tsToNumber(b.updatedAt) || tsToNumber(b.createdAt) || 0;
  return bt - at; // newest first
}

// ---------- Orders (buyer reads) ----------
export async function getMyOrders(uid, { limitTo = 100 } = {}) {
  if (!uid) return [];
  const qy = query(
    collection(db, 'orders'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(limitTo)
  );
  const snap = await getDocs(qy);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getOrderById(orderId) {
  if (!orderId) return null;
  const ref = doc(db, 'orders', orderId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Batch-hydrate events referenced by orders. Missing/forbidden events are skipped. */
export async function getEventsByIds(ids = []) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const out = {};
  await Promise.all(
    unique.map(async (id) => {
      try {
        const s = await getDoc(doc(db, 'events', id));
        if (s.exists()) out[id] = { id: s.id, ...s.data() };
      } catch {
        // If rules deny, just skip; UI will handle gracefully.
      }
    })
  );
  return out;
}
