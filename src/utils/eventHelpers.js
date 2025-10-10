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
