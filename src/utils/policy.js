// src/utils/policy.js

// Bump this when you materially change the Privacy Policy text.
// Use a date-like or semver value — either is fine.
export const PRIVACY_VERSION = '2025-10-09';
export const PRIVACY_ROUTE = '/privacy';

// Cookie consent storage key (keep stable unless you want to re-ask everyone)
export const COOKIE_CONSENT_KEY = 'cookie-consent-v1';

export function hasCookieConsent() {
  try {
    return !!localStorage.getItem(COOKIE_CONSENT_KEY);
  } catch (err) {
    console.error('Could not access localStorage', err);
    // If storage is unavailable (private mode / blocked), treat as consent not required.
    return true;
  }
}

export function recordCookieConsent() {
  try {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({ acceptedAt: new Date().toISOString(), v: 1 })
    );
  } catch (err) {
    console.error('Could not access localStorage', err);
    // Storage not available—ignore.
    void 0;
  }
}

export const PRIVACY_LOCAL_ACCEPT_KEY = `privacy-accepted-v:${PRIVACY_VERSION}`;

export function getLocalPrivacyAccepted() {
  try {
    return localStorage.getItem(PRIVACY_LOCAL_ACCEPT_KEY) === '1';
  } catch {
    return false;
  }
}

export function setLocalPrivacyAccepted() {
  try {
    localStorage.setItem(PRIVACY_LOCAL_ACCEPT_KEY, '1');
  } catch {
    /* ignore */
  }
}
