import { useEffect, useState } from 'react';

/**
 * Debounce any primitive value.
 * @param {any} value
 * @param {number} delay ms
 */
export default function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
