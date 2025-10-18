// src/utils/eventHelpers.js

export function ticketsRemaining(ev) {
  const cap = Math.max(0, ev.capacity ?? 0);
  const sold = Math.max(0, ev.ticketsSold ?? 0);
  return Math.max(0, cap - sold);
}

export function anyTicketTypeAvailable(ev) {
  const types = Array.isArray(ev.ticketTypes) ? ev.ticketTypes : [];
  return types.some((t) => t?.available === true);
}

/**
 * True if the event can be purchased/claimed right now.
 * Covers:
 * - Free/payWhatYouWant events
 * - Fixed price events with at least one available ticket type OR a flat `price`
 * - Capacity must remain
 */
export function isOnSale(ev) {
  if (ticketsRemaining(ev) <= 0) return false;

  if (ev.priceType === 'free' || ev.priceType === 'payWhatYouWant') {
    return true;
  }

  // If you support a single flat price (no ticket types)
  if (typeof ev.price === 'number') return true;

  // Otherwise rely on per-type availability
  return anyTicketTypeAvailable(ev);
}

export const isPublished = (ev) =>
  ev?.publishStatus === 'published' && ev?.moderationStatus === 'approved';

export function shouldShowSaleBadgeInMyEvents(ev) {
  const state = computeLifecycle(ev);
  if (!isPublished(ev)) return false;
  return state === 'upcoming' || state === 'live';
}

/** High-level lifecycle state for list badges */
export function computeLifecycle(ev, now = new Date()) {
  const startsAt = new Date(ev.startsAt);
  const endsAt = new Date(ev.endsAt);

  if (ev?.moderationStatus !== 'approved') {
    return ev?.moderationStatus; // 'pending' | 'rejected'
  }

  if (ev?.publishStatus !== 'published') {
    return 'draft'; // or 'unpublished' if you prefer
  }

  if (endsAt < now) return 'ended';
  if (startsAt > now) return 'upcoming';
  return 'live';
}

export function formatMoney(value, currency) {
  if (typeof value !== 'number') return '—';
  const c = currency || '';
  return `${c} ${value.toFixed(2)}`;
}

export function cheapestAvailableTicket(ev) {
  const types = Array.isArray(ev.ticketTypes) ? ev.ticketTypes : [];
  const available = types.filter(
    (t) => t && t.available === true && typeof t.price === 'number'
  );
  if (available.length === 0) return null;
  return available.reduce(
    (min, t) => (t.price < min.price ? t : min),
    available[0]
  );
}

export function getTicketsAvailableNumber(ev) {
  return Math.max(0, (ev.capacity ?? 0) - (ev.ticketsSold ?? 0));
}

export function tsToNumber(x) {
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

export const lc = (v) => (v == null ? '' : String(v)).toLowerCase();
export function isSameDay(dateLike, term) {
  const t = Date.parse(term);
  if (Number.isNaN(t)) return false;
  const d1 = new Date(dateLike);
  const d2 = new Date(t);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function shortId(id, head = 6, tail = 6) {
  if (!id) return '';
  if (id.length <= head + tail + 1) return id;
  return `${id.slice(0, head)}…${id.slice(-tail)}`;
}
