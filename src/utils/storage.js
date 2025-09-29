const KEY = 'adventum_auth';

function safeGet(storage) {
  try {
    const raw = storage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeSet(storage, value) {
  try {
    storage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* ignore quota/errors */
  }
}

function safeRemove(storage) {
  try {
    storage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

// Read preference: prefer localStorage, then sessionStorage
export function loadSession() {
  const fromLocal =
    typeof localStorage !== 'undefined' ? safeGet(localStorage) : null;
  if (fromLocal) return { ...fromLocal, _source: 'local' };
  const fromSession =
    typeof sessionStorage !== 'undefined' ? safeGet(sessionStorage) : null;
  if (fromSession) return { ...fromSession, _source: 'session' };
  return null;
}

// Save to either localStorage or sessionStorage
export function saveSession(data, remember) {
  if (remember && typeof localStorage !== 'undefined') {
    safeSet(localStorage, data);
    if (typeof sessionStorage !== 'undefined') safeRemove(sessionStorage);
  } else if (typeof sessionStorage !== 'undefined') {
    safeSet(sessionStorage, data);
    if (typeof localStorage !== 'undefined') safeRemove(localStorage);
  }
}

export function clearSession() {
  if (typeof localStorage !== 'undefined') safeRemove(localStorage);
  if (typeof sessionStorage !== 'undefined') safeRemove(sessionStorage);
}
