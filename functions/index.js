// functions/index.js
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

// Initialize Admin SDK once (works with Admin v12+)
if (!getApps().length) {
  initializeApp();
}

/** Helper: read role */
async function readRole(uid) {
  const db = getFirestore();
  const snap = await db.collection('profiles').doc(uid).get();
  return snap.exists ? snap.data()?.role : null;
}

/** Block account deletion if user has events/orders */
export const deleteIfNoDependencies = onCall(async (context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const db = getFirestore();
  const adminAuth = getAdminAuth();

  // Check for dependent docs owned by this user
  const [eventsSnap, ordersSnap] = await Promise.all([
    db.collection('events').where('createdBy', '==', uid).get(),
    db.collection('orders').where('userId', '==', uid).get(),
  ]);

  const eventsCount = eventsSnap.size;
  const ordersCount = ordersSnap.size;
  const hasDeps = ordersCount > 0 || eventsCount > 0;

  // Has dependencies → block deletion
  if (hasDeps) {
    return {
      deleted: false,
      message: 'Account deletion was blocked by the server.',
      details: {
        code: 'blocked-has-dependencies',
        events: eventsCount,
        orders: ordersCount,
      },
    };
  }

  // No dependencies → delete profile + auth user
  await db.collection('profiles').doc(uid).delete();
  await adminAuth.deleteUser(uid);

  return { deleted: true };
});

/** STAFF: cascade delete a user (use req.data & req.auth) */
export const staffDeleteUserCascade = onCall(async (req) => {
  const adminUid = req.auth?.uid;
  if (!adminUid)
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  const role = await readRole(adminUid);
  if (role !== 'staff')
    throw new HttpsError('permission-denied', 'Staff only.');

  const targetUid = req.data?.userId;
  if (!targetUid) throw new HttpsError('invalid-argument', 'Missing userId.');

  const db = getFirestore();
  const adminAuth = getAdminAuth();

  const eventsSnap = await db
    .collection('events')
    .where('createdBy', '==', targetUid)
    .get();
  const eventIds = eventsSnap.docs.map((d) => d.id);

  const ordersByUserSnap = await db
    .collection('orders')
    .where('userId', '==', targetUid)
    .get();

  const ordersForEventsDocs = [];
  for (const evId of eventIds) {
    const snap = await db
      .collection('orders')
      .where('eventId', '==', evId)
      .get();
    if (!snap.empty) ordersForEventsDocs.push(...snap.docs);
  }

  const seen = new Set();
  const ordersAllDocs = [];
  for (const d of [...ordersByUserSnap.docs, ...ordersForEventsDocs]) {
    if (!seen.has(d.id)) {
      seen.add(d.id);
      ordersAllDocs.push(d);
    }
  }

  async function deleteDocs(docs) {
    let count = 0;
    while (docs.length) {
      const chunk = docs.splice(0, 500);
      const batch = db.batch();
      for (const d of chunk) batch.delete(d.ref);
      await batch.commit();
      count += chunk.length;
    }
    return count;
  }

  const ordersDeleted = await deleteDocs(ordersAllDocs);
  const eventsDeleted = await deleteDocs([...eventsSnap.docs]);

  await db
    .collection('profiles')
    .doc(targetUid)
    .delete()
    .catch(() => {});
  await adminAuth.deleteUser(targetUid).catch((e) => {
    if (e?.errorInfo?.code !== 'auth/user-not-found') throw e;
  });

  return {
    deleted: true,
    summary: {
      eventsDeleted,
      ordersDeleted,
      profileDeleted: true,
      authDeleted: true,
    },
  };
});

/** STAFF: cascade delete one event (use req.data & req.auth) */
export const staffCascadeDeleteEvent = onCall(async (req) => {
  const uid = req.auth?.uid;
  if (!uid)
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  const eventId = req.data?.eventId;
  if (!eventId) throw new HttpsError('invalid-argument', 'Missing eventId');

  const role = await readRole(uid);
  if (role !== 'staff')
    throw new HttpsError('permission-denied', 'Staff only.');

  const db = getFirestore();

  const ordersSnap = await db
    .collection('orders')
    .where('eventId', '==', eventId)
    .get();
  if (!ordersSnap.empty) {
    const batch = db.batch();
    ordersSnap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  await db.collection('events').doc(eventId).delete();
  return { deleted: true, ordersDeleted: ordersSnap.size };
});

/** CREATOR: safe delete (use req.data & req.auth) */
export const creatorDeleteEventSafely = onCall(async (req) => {
  const uid = req.auth?.uid;
  if (!uid)
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  const eventId = req.data?.eventId;
  if (!eventId) throw new HttpsError('invalid-argument', 'Missing eventId');

  const db = getFirestore();
  const role = await readRole(uid);
  const isStaff = role === 'staff';

  const evRef = db.collection('events').doc(eventId);
  const evSnap = await evRef.get();
  if (!evSnap.exists) return { deleted: false, message: 'Event not found.' };

  const ev = evSnap.data();
  const isOwner = ev.createdBy === uid;
  if (!(isStaff || (isOwner && ev.publishStatus !== 'published'))) {
    throw new HttpsError(
      'permission-denied',
      'Not allowed to delete this event.'
    );
  }

  const ordersSnap = await db
    .collection('orders')
    .where('eventId', '==', eventId)
    .get();
  if (!isStaff && !ordersSnap.empty) {
    return {
      deleted: false,
      message: 'Event has linked orders and cannot be deleted by the creator.',
      details: { code: 'blocked-has-orders', orders: ordersSnap.size },
    };
  }

  await evRef.delete();
  return { deleted: true };
});
