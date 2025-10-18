// src/services/cloudFunctions.js
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/services/firebase';

export async function callDeleteIfNoDependencies() {
  const fn = httpsCallable(functions, 'deleteIfNoDependencies');
  const result = await fn();
  return result.data; // structured response from the Cloud Function
}

export async function callStaffDeleteUserCascade(userId) {
  const fn = httpsCallable(functions, 'staffDeleteUserCascade');
  const result = await fn({ userId });
  return result.data; // { deleted: true, summary: { ...counts } }
}

export async function callStaffCascadeDeleteEvent(eventId) {
  const fn = httpsCallable(functions, 'staffCascadeDeleteEvent');
  const result = await fn({ eventId });
  return result.data; // { deleted: true, ordersDeleted: number }
}

export async function callCreatorDeleteEventSafely(eventId) {
  const fn = httpsCallable(functions, 'creatorDeleteEventSafely');
  const result = await fn({ eventId });
  return result.data; // { deleted: boolean, message?, details? }
}

// src/services/cloudFunctions.js
export async function callStaffSetModerationStatus(
  eventId,
  moderationStatus,
  reason = ''
) {
  const fn = httpsCallable(functions, 'staffSetModerationStatus');
  const { data } = await fn({ eventId, moderationStatus, reason });
  return data;
}

export async function getRole(uid) {
  const fn = httpsCallable(functions, 'getRole');
  const { data } = await fn({ uid });
  return data.role;
}

export async function callPublishEvent(eventId) {
  const fn = httpsCallable(functions, 'publishEvent');
  const res = await fn({ eventId });
  return res.data; // { published: true, moderationStatus }
}

export async function callSetPublishStatus(eventId, publish) {
  const fn = httpsCallable(functions, 'setPublishStatus');
  const res = await fn({ eventId, publish });
  return res.data; // { publishStatus, moderationStatus }
}

export async function callStaffSetUserRole(userId, role) {
  const fn = httpsCallable(functions, 'staffSetUserRole');
  const { data } = await fn({ userId, role });
  return data; // { ok, role }
}

export async function callStaffSetUserBlocked(userId, blocked) {
  const fn = httpsCallable(functions, 'staffSetUserBlocked');
  const { data } = await fn({ userId, blocked });
  return data; // { ok, blocked }
}

export async function callStaffBackfillProfileEmails() {
  const fn = httpsCallable(functions, 'staffBackfillProfileEmails');
  const { data } = await fn();
  return data; // { ok, updated }
}

export async function callCreateCheckoutSession(payload) {
  const fn = httpsCallable(functions, 'createCheckoutSession');
  const res = await fn(payload);
  return res.data || {};
}

export async function callCreateFreeOrder(payload) {
  const fn = httpsCallable(functions, 'createFreeOrder');
  const res = await fn(payload);
  return res.data || {};
}

export async function callFinalizeCheckoutSession(sessionId) {
  const fn = httpsCallable(functions, 'finalizeCheckoutSession');
  const res = await fn({ sessionId });
  return res.data || {};
}
