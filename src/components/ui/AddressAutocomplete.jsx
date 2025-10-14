// src/components/ui/AddressAutocomplete.jsx
import { useEffect, useRef, useState } from 'react';
import { Field, Label } from '@/components/catalyst-ui-kit/fieldset';
import { Input } from '@/components/catalyst-ui-kit/input';
import { ChevronDownIcon, MapPinIcon } from '@heroicons/react/16/solid';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { searchAddress } from '@/services/geo';

function ensureAddress(base) {
  // Create a fresh object when value was null
  return {
    line1: '',
    line2: '',
    city: '',
    region: '',
    postalCode: '',
    countryCode: '',
    countryName: '',
    lat: null,
    lng: null,
    placeId: '',
    ...(base || {}),
  };
}

export default function AddressAutocomplete({
  value, // can be null
  onChange, // (addr|null) => void
  label = 'Street address',
  placeholder = 'Start typing an address…',
}) {
  const [query, setQuery] = useState(value?.line1 || '');
  const debounced = useDebouncedValue(query, 300);

  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // fetch suggestions
  useEffect(() => {
    let ignore = false;
    async function run() {
      if (!debounced || debounced.length < 3) {
        if (!ignore) setSuggestions([]);
        return;
      }
      try {
        const list = await searchAddress(debounced);
        if (!ignore) setSuggestions(list);
      } catch {
        if (!ignore) setSuggestions([]);
      }
    }
    run();
    return () => (ignore = true);
  }, [debounced]);

  // close on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function setAddr(next) {
    // if every field empty, return null
    const hasAny =
      next.line1?.trim() ||
      next.city?.trim() ||
      next.region?.trim() ||
      next.postalCode?.trim() ||
      next.countryName?.trim() ||
      (next.lat != null && next.lng != null);
    onChange?.(hasAny ? next : null);
  }

  function pickSuggestion(sug) {
    setQuery(sug.line1);
    setOpen(false);
    setAddr(
      ensureAddress({
        line1: sug.line1,
        city: sug.city,
        region: sug.region,
        postalCode: sug.postalCode,
        countryCode: sug.countryCode,
        countryName: sug.countryName,
        lat: sug.lat,
        lng: sug.lng,
        placeId: sug.placeId,
      })
    );
  }

  return (
    <Field ref={rootRef}>
      <Label>{label}</Label>
      <div className='relative'>
        <Input
          name='street-address'
          autoComplete='street-address'
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            const line1 = e.target.value;
            setQuery(line1);
            setOpen(true);
            setAddr(ensureAddress({ ...(value || {}), line1 }));
          }}
          onFocus={() => setOpen(true)}
        />

        {open && suggestions.length > 0 && (
          <div className='absolute z-20 mt-1 w-full rounded-md border border-white/10 bg-zinc-900 py-1 shadow-lg'>
            <ul className='max-h-64 overflow-auto'>
              {suggestions.map((s) => (
                <li key={s.placeId}>
                  <button
                    type='button'
                    onClick={() => pickSuggestion(s)}
                    className='flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-white/5'
                  >
                    <MapPinIcon className='mt-1 size-4 text-zinc-400' />
                    <div className='text-sm'>
                      <div className='text-zinc-100'>{s.line1}</div>
                      <div className='text-zinc-400'>
                        {[s.city, s.region, s.postalCode, s.countryName]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Secondary fields (only show once user started typing or has an address) */}
      {(query || value) && (
        <div className='mt-4 grid grid-cols-1 gap-4 sm:grid-cols-6'>
          <div className='sm:col-span-2'>
            <Label>City</Label>
            <Input
              name='city'
              value={value?.city || ''}
              onChange={(e) =>
                setAddr(
                  ensureAddress({ ...(value || {}), city: e.target.value })
                )
              }
              autoComplete='address-level2'
            />
          </div>
          <div className='sm:col-span-2'>
            <Label>State / Province</Label>
            <Input
              name='region'
              value={value?.region || ''}
              onChange={(e) =>
                setAddr(
                  ensureAddress({ ...(value || {}), region: e.target.value })
                )
              }
              autoComplete='address-level1'
            />
          </div>
          <div className='sm:col-span-2'>
            <Label>ZIP / Postal code</Label>
            <Input
              name='postal-code'
              value={value?.postalCode || ''}
              onChange={(e) =>
                setAddr(
                  ensureAddress({
                    ...(value || {}),
                    postalCode: e.target.value,
                  })
                )
              }
              autoComplete='postal-code'
            />
          </div>
          <div className='sm:col-span-3'>
            <Label>Country</Label>
            <div className='relative'>
              <Input
                name='country'
                value={value?.countryName || ''}
                onChange={(e) =>
                  setAddr(
                    ensureAddress({
                      ...(value || {}),
                      countryName: e.target.value,
                      countryCode: '', // unknown if typed manually
                    })
                  )
                }
                placeholder='Country'
                autoComplete='country-name'
              />
              <ChevronDownIcon
                aria-hidden='true'
                className='pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-gray-400'
              />
            </div>
          </div>
          <div className='sm:col-span-3'>
            <Label>Address line 2 (optional)</Label>
            <Input
              name='address-line2'
              value={value?.line2 || ''}
              onChange={(e) =>
                setAddr(
                  ensureAddress({ ...(value || {}), line2: e.target.value })
                )
              }
              placeholder='Apt, suite, unit…'
            />
          </div>
        </div>
      )}
    </Field>
  );
}
