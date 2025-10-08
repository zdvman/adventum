// src/services/geo.js
// Free geocoding via OpenStreetMap Nominatim (public endpoint)
// Read & honor their usage policy: https://operations.osmfoundation.org/policies/nominatim/

const CONTACT_EMAIL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OSM_EMAIL) || ''; // optional but recommended

/**
 * Normalize a Nominatim result to our app's shape.
 */
function mapResult(item) {
  const a = item.address || {};
  const line1 =
    item.display_name?.split(',')?.[0]?.trim() ||
    [a.house_number, a.road].filter(Boolean).join(' ') ||
    a.road ||
    '';

  return {
    // App shape
    line1,
    line2: '',
    city: a.city || a.town || a.village || a.hamlet || '',
    region:
      a.state || a.region || a.state_district || a.county || a.province || '',
    postalCode: a.postcode || '',
    countryCode: (a.country_code || '').toUpperCase(),
    countryName: a.country || '',
    lat: item.lat ? Number(item.lat) : null,
    lng: item.lon ? Number(item.lon) : null,
    placeId: String(item.place_id || ''),
  };
}

/**
 * Search addresses globally.
 * @param {string} q
 * @returns {Promise<Array<ReturnType<typeof mapResult>>>}
 */
export async function searchAddress(q) {
  const params = new URLSearchParams({
    q,
    format: 'json',
    addressdetails: '1',
    limit: '8',
  });
  if (CONTACT_EMAIL) params.set('email', CONTACT_EMAIL);

  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      // Be nice to their servers – add a UA
      Accept: 'application/json',
      'User-Agent': CONTACT_EMAIL
        ? `Adventum/1.0 (${CONTACT_EMAIL})`
        : 'Adventum/1.0',
      Referer: location.origin,
    },
  });
  if (!res.ok) return [];
  const json = await res.json();
  if (!Array.isArray(json)) return [];
  return json.map(mapResult);
}
