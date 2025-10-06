export function slugify(s) {
  return (s || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function composeIdSlug(id, title) {
  const s = slugify(title);
  return `${id}${s ? `-${s}` : ''}`;
}

export function splitIdSlug(idSlug) {
  const [id, ...rest] = String(idSlug || '').split('-');
  return { id, slug: rest.join('-') || '' };
}
