// src/services/api.js
import { db } from '@/services/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import {
  callStaffCascadeDeleteEvent,
  callCreatorDeleteEventSafely,
  callStaffDeleteUserCascade, // already exported for future admin screens
} from '@/services/cloudFunctions';

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

/** Staff-only cascade delete (event + related orders) */
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
