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
