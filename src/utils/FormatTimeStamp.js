/**
 * Format a date string or timestamp into a human-readable date.
 * @param {string|number|Date} input - ISO string, timestamp, or Date
 * @param {Object} options - Formatting options
 * @returns {string} e.g. "12 Nov 2025"
 */
export function formatDate(input, options = {}) {
  const date = new Date(input);
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

/**
 * Format a date string or timestamp into 24-hour time.
 * @param {string|number|Date} input - ISO string, timestamp, or Date
 * @returns {string} e.g. "15:30"
 */
export function formatTime24(input) {
  const date = new Date(input);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Convenience function: returns { date, time } both formatted
 * @param {string|number|Date} input
 * @returns {{ date: string, time: string }}
 */
export function formatDateTime(input) {
  return {
    date: formatDate(input),
    time: formatTime24(input),
  };
}
