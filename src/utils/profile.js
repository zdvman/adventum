// src/utils/profile.js

export function getFullName(profile) {
  if (!profile) return '';
  const parts = [profile.firstName, profile.lastName]
    .map((p) => (p || '').trim())
    .filter(Boolean);
  return parts.join(' ');
}

export function displayName(profile, emailFallback = '') {
  const full = getFullName(profile);
  if (full) return full;
  if (profile?.username) return profile.username;
  return emailFallback || 'User';
}
