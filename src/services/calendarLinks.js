// src/utils/calendarLinks.js
function pad(n) {
  return String(n).padStart(2, '0');
}

function toGCalDate(dateLike) {
  const d = new Date(dateLike);
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Build a prefilled "Create event" link for Google Calendar.
 * `endsAt` is optional; defaults to +1 hour if missing.
 * `ctz` is an optional IANA tz (e.g. "Europe/London") for display.
 */
export function buildGoogleCalendarUrl({
  title,
  startsAt,
  endsAt,
  location,
  description,
  ctz,
  url,
}) {
  const end = endsAt || new Date(new Date(startsAt).getTime() + 60 * 60 * 1000);
  const dates = `${toGCalDate(startsAt)}/${toGCalDate(end)}`;

  const details = [description || '', url || ''].filter(Boolean).join('\n');

  const params = [
    `action=TEMPLATE`,
    `text=${encodeURIComponent(title || 'Event')}`,
    `dates=${dates}`,
    `details=${encodeURIComponent(details)}`,
    location ? `location=${encodeURIComponent(location)}` : '',
    ctz ? `ctz=${encodeURIComponent(ctz)}` : '',
  ]
    .filter(Boolean)
    .join('&');

  return `https://calendar.google.com/calendar/render?${params}`;
}
