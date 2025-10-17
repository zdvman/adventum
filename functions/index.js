// functions/index.js
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import crypto from 'crypto';

// Initialize Admin SDK once (works with Admin v12+)
if (!getApps().length) {
  initializeApp();
}

function computeContentHash(ev) {
  // Only fields affecting moderation should be hashed
  const parts = [
    ev.title || '',
    ev.description || '',
    ev.aboutHtml || '',
    ev.image || '',
    ev.startsAt || '',
    ev.endsAt || '',
    String(ev.capacity ?? ''),
    ev.priceType || '',
    typeof ev.price === 'number' ? String(ev.price) : '',
    ev.currency || '',
    ev.organizerName || '',
    ev.organizerWebsite || '',
    ev.categoryId || '',
    ev.categoryName || '',
    ev.venueId || '',
    // If you add ticketTypes later and want them moderated, include a stable serialization here.
  ];
  return crypto
    .createHash('md5')
    .update(parts.join('||'), 'utf8')
    .digest('hex');
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

// STAFF: set moderationStatus on an event (ALSO stamps approvedHash when approving)
export const staffSetModerationStatus = onCall(async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');

  const role = await readRole(uid);
  if (role !== 'staff') {
    throw new HttpsError('permission-denied', 'Staff only.');
  }

  const { eventId, moderationStatus, reason } = req.data || {};
  if (!eventId || !moderationStatus) {
    throw new HttpsError(
      'invalid-argument',
      'Missing eventId/moderationStatus.'
    );
  }

  const db = getFirestore();
  const ref = db.collection('events').doc(eventId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Event not found.');
  const ev = snap.data();

  const patch = {
    moderationStatus,
    updatedAt: new Date().toISOString(),
  };
  if (reason) patch.moderationReason = reason;

  if (moderationStatus === 'approved') {
    patch.approvedAt = new Date().toISOString();
    patch.approvedHash = computeContentHash(ev); // snapshot what was approved
  }

  await ref.update(patch);
  return { ok: true };
});

// Backwards-compatible publish (always publish = true)
// Keeps "pending" only if content changed since last approval; otherwise keeps approved.
export const publishEvent = onCall(async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');
  const eventId = req.data?.eventId;
  if (!eventId) throw new HttpsError('invalid-argument', 'Missing eventId.');

  const db = getFirestore();
  const role = await readRole(uid);
  const isStaff = role === 'staff';

  const ref = db.collection('events').doc(eventId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Event not found.');

  const ev = snap.data();
  const isOwner = ev.createdBy === uid;
  if (!(isOwner || isStaff))
    throw new HttpsError('permission-denied', 'Not allowed.');

  // Determine moderation
  const currentHash = computeContentHash(ev);
  let nextModeration = ev.moderationStatus || null;

  if (ev.moderationStatus === 'approved') {
    // Re-publishing an approved event → only go pending if content changed
    if (ev.approvedHash && ev.approvedHash === currentHash) {
      nextModeration = 'approved'; // keep
    } else {
      nextModeration = 'pending';
    }
  } else if (ev.moderationStatus === 'pending') {
    // Already pending: keep pending
    nextModeration = 'pending';
  } else {
    // never approved before → needs moderation
    nextModeration = 'pending';
  }

  await ref.update({
    publishStatus: 'published',
    moderationStatus: nextModeration,
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return { published: true, moderationStatus: nextModeration };
});

// Explicit toggle publish on/off without forcing pending if unchanged content
export const setPublishStatus = onCall(async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');
  const { eventId, publish } = req.data || {};
  if (!eventId || typeof publish !== 'boolean') {
    throw new HttpsError('invalid-argument', 'Missing eventId/publish.');
  }

  const db = getFirestore();
  const role = await readRole(uid);
  const isStaff = role === 'staff';

  const ref = db.collection('events').doc(eventId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Event not found.');

  const ev = snap.data();
  const isOwner = ev.createdBy === uid;
  if (!(isOwner || isStaff))
    throw new HttpsError('permission-denied', 'Not allowed.');

  if (!publish) {
    // Unpublish → do NOT touch moderationStatus
    await ref.update({
      publishStatus: 'draft',
      updatedAt: new Date().toISOString(),
    });
    return {
      publishStatus: 'draft',
      moderationStatus: ev.moderationStatus ?? null,
    };
  }

  // publish == true
  const currentHash = computeContentHash(ev);

  let nextModeration;
  if (ev.moderationStatus === 'approved' && ev.approvedHash === currentHash) {
    nextModeration = 'approved'; // unchanged, keep approved
  } else if (ev.moderationStatus === 'pending') {
    nextModeration = 'pending'; // already submitted
  } else {
    nextModeration = 'pending'; // first submission OR changed since last approval
  }

  await ref.update({
    publishStatus: 'published',
    moderationStatus: nextModeration,
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return { publishStatus: 'published', moderationStatus: nextModeration };
});

// --- STAFF: set user role ---
export const staffSetUserRole = onCall(async (req) => {
  const adminUid = req.auth?.uid;
  if (!adminUid) throw new HttpsError('unauthenticated', 'Sign in required.');
  const role = await readRole(adminUid);
  if (role !== 'staff')
    throw new HttpsError('permission-denied', 'Staff only.');

  const { userId, role: nextRole } = req.data || {};
  if (!userId || !['member', 'staff'].includes(nextRole)) {
    throw new HttpsError(
      'invalid-argument',
      'Missing/invalid { userId, role }.'
    );
  }

  const db = getFirestore();
  await db.collection('profiles').doc(userId).update({
    role: nextRole,
    updatedAt: new Date().toISOString(),
  });

  // (Optional) also set a custom claim if you later use it in backend checks
  // await getAdminAuth().setCustomUserClaims(userId, { role: nextRole });

  return { ok: true, role: nextRole };
});

// --- STAFF: block / unblock user (Auth + Profile) ---
export const staffSetUserBlocked = onCall(async (req) => {
  const adminUid = req.auth?.uid;
  if (!adminUid) throw new HttpsError('unauthenticated', 'Sign in required.');
  const role = await readRole(adminUid);
  if (role !== 'staff')
    throw new HttpsError('permission-denied', 'Staff only.');

  const { userId, blocked } = req.data || {};
  if (!userId || typeof blocked !== 'boolean') {
    throw new HttpsError(
      'invalid-argument',
      'Missing/invalid { userId, blocked }.'
    );
  }

  const db = getFirestore();
  const adminAuth = getAdminAuth();

  // Disable/enable Auth user login
  await adminAuth.updateUser(userId, { disabled: blocked });

  // Mirror to profile for UI
  await db.collection('profiles').doc(userId).update({
    blocked,
    updatedAt: new Date().toISOString(),
  });

  return { ok: true, blocked };
});

export const staffBackfillProfileEmails = onCall(async (req) => {
  const adminUid = req.auth?.uid;
  if (!adminUid) throw new HttpsError('unauthenticated', 'Sign in required.');
  const role = await readRole(adminUid);
  if (role !== 'staff')
    throw new HttpsError('permission-denied', 'Staff only.');

  const db = getFirestore();
  const adminAuth = getAdminAuth();

  let updated = 0;
  let token = undefined;

  do {
    const page = await adminAuth.listUsers(1000, token);
    token = page.pageToken;

    const batch = db.batch();
    for (const u of page.users) {
      const ref = db.collection('profiles').doc(u.uid);
      batch.set(
        ref,
        {
          email: u.email || '',
          providerIds: (u.providerData || []).map((p) => p.providerId),
          authDisabled: !!u.disabled,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      updated++;
    }
    await batch.commit();
  } while (token);

  return { ok: true, updated };
});
