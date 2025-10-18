// src/pages/CheckoutStart.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';

import { Button } from '@/components/catalyst-ui-kit/button';
import { Select } from '@/components/catalyst-ui-kit/select';
import { Input } from '@/components/catalyst-ui-kit/input';
import { Heading } from '@/components/catalyst-ui-kit/heading';
import { Text, Strong } from '@/components/catalyst-ui-kit/text';

import AlertPopup from '@/components/ui/AlertPopup';
import Loading from '@/components/ui/Loading';

import {
  callCreateCheckoutSession,
  callCreateFreeOrder,
} from '@/services/cloudFunctions';
import { ticketsRemaining, formatMoney } from '@/utils/eventHelpers';
import { getEventByIdServer } from '@/services/api';

const ORDER_DETAIL_PATH = (orderId) => `/account/orders/${orderId}`;

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
function toMinorUnits(amount) {
  return Math.round(Number(amount || 0) * 100);
}

export default function CheckoutStart() {
  const { eventId } = useParams();
  const { user, initializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [ev, setEv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guard, setGuard] = useState('ok'); // 'ok' | 'notfound' | 'forbidden'
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  // PWYW editing state
  const [pwywDraft, setPwywDraft] = useState('10');
  const [pwywValue, setPwywValue] = useState(10);
  const pwywStep = 5;

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  // ---------- Load event (fresh) ----------
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!eventId) {
        setGuard('notfound');
        setLoading(false);
        return;
      }
      setLoading(true);
      setGuard('ok');
      try {
        const snap = await getEventByIdServer(eventId);
        if (!snap.exists()) {
          if (!ignore) setGuard('notfound');
          return;
        }
        const data = { id: snap.id, ...snap.data() };
        if (!ignore) setEv(data);
      } catch (e) {
        console.error('Error loading event for checkout:', e);
        if (!ignore) setGuard('forbidden');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    if (!initializing) load();
    return () => {
      ignore = true;
    };
  }, [eventId, initializing]);

  // ---------- Derived ----------
  const remaining = ticketsRemaining(ev || {});
  const maxQty = Math.min(10, Math.max(0, remaining));
  const onSale =
    ev?.publishStatus === 'published' &&
    ev?.moderationStatus === 'approved' &&
    remaining > 0;

  const currency = (ev?.currency || 'EUR').toUpperCase();
  const isFixed = ev?.priceType === 'fixed';
  const isFree = ev?.priceType === 'free';
  const isPWYW = ev?.priceType === 'payWhatYouWant';

  // Price math
  const unitPrice = isFixed
    ? Number(ev?.price || 0)
    : isPWYW
    ? Number(pwywValue || 0)
    : 0;
  const total = unitPrice * qty;

  // Minimum paid amount per currency (Stripe)
  const minMinorMap = { USD: 50, EUR: 50, GBP: 30 }; // cents/pence
  const minPaid = (minMinorMap[currency] ?? 50) / 100;
  const pwywTooLow = isPWYW && unitPrice > 0 && unitPrice < minPaid;

  // ---------- Init qty from URL ?qty= (robust) ----------
  const initialQtyFromURL = useMemo(() => {
    const search = new URLSearchParams(location.search);
    const raw = parseInt(search.get('qty') || '1', 10);
    return Number.isFinite(raw) ? raw : 1;
  }, [location.search]);

  const didInitQty = useRef(false);
  useEffect(() => {
    // Set qty once, when we know maxQty (avoids fighting user interactions)
    if (ev && maxQty > 0 && !didInitQty.current) {
      setQty(clamp(initialQtyFromURL, 1, maxQty));
      didInitQty.current = true;
    }
  }, [ev, maxQty, initialQtyFromURL]);

  // ---------- Init PWYW default ----------
  useEffect(() => {
    if (!ev) return;
    if (isPWYW) {
      const def =
        typeof ev?.suggestedPrice === 'number' ? ev.suggestedPrice : 10;
      const c = clamp(def, 0, 999999);
      setPwywValue(c);
      setPwywDraft(String(c));
    }
  }, [ev, isPWYW]);

  // ---------- Qty options ----------
  const qtyOptions = useMemo(
    () => Array.from({ length: maxQty || 1 }, (_, i) => i + 1),
    [maxQty]
  );

  // ---------- Guards ----------
  if (initializing || loading) return <Loading label='Loading checkout…' />;
  if (guard === 'notfound') {
    return (
      <div className='py-16 text-center'>
        <Heading className='!text-zinc-100'>Event not found</Heading>
        <Text className='!mt-2 !text-zinc-400'>
          Please check the link and try again.
        </Text>
      </div>
    );
  }
  if (guard === 'forbidden') {
    return (
      <div className='py-16 text-center'>
        <Heading className='!text-zinc-100'>Access denied</Heading>
        <Text className='!mt-2 !text-zinc-400'>
          You do not have permission to view this event.
        </Text>
      </div>
    );
  }
  if (!ev) return null;

  // ---------- Actions ----------
  async function requireLogin() {
    if (!user) {
      const redir = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?redirect=${redir}`);
      return true;
    }
    return false;
  }

  async function handleBuy() {
    if (await requireLogin()) return;

    const safeQty = clamp(qty, 1, maxQty || 1);
    setBusy(true);
    try {
      if (isFixed) {
        const { url } = await callCreateCheckoutSession({
          eventId: ev.id,
          quantity: safeQty,
          currency,
        });
        if (!url) throw new Error('No checkout URL returned by server.');
        window.location.assign(url);
        return;
      }

      if (isPWYW) {
        const amount = clamp(Number(pwywValue || 0), 0, 999999);
        if (amount > 0) {
          const { url } = await callCreateCheckoutSession({
            eventId: ev.id,
            quantity: safeQty,
            currency,
            overrideUnitAmount: toMinorUnits(amount),
            isPWYW: true,
          });
          if (!url) throw new Error('No checkout URL returned by server.');
          window.location.assign(url);
          return;
        }
        const { orderId } = await callCreateFreeOrder({
          eventId: ev.id,
          quantity: safeQty,
          priceType: 'payWhatYouWant',
          unitAmount: 0,
          currency,
        });
        navigate(ORDER_DETAIL_PATH(orderId) || '');
        return;
      }

      if (isFree) {
        const { orderId } = await callCreateFreeOrder({
          eventId: ev.id,
          quantity: safeQty,
          priceType: 'free',
          unitAmount: 0,
          currency,
        });
        navigate(ORDER_DETAIL_PATH(orderId) || '');
        return;
      }

      throw new Error('Unsupported price type.');
    } catch (e) {
      setAlertTitle('Checkout failed');
      setAlertMessage(
        e?.message || 'Something went wrong while starting checkout.'
      );
      setIsAlertOpen(true);
    } finally {
      setBusy(false);
    }
  }

  // ---------- UI ----------
  return (
    <div className='mx-auto max-w-3xl px-4 py-10 text-zinc-100'>
      <Heading className='text-3xl md:text-4xl'>
        <Strong>Checkout</Strong>
      </Heading>
      <Text className='!mt-2 !text-zinc-400'>
        You’re purchasing tickets for{' '}
        <Strong className='!text-zinc-100'>{ev.title}</Strong>
      </Text>

      <div className='mt-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-sm'>
        {/* Price row */}
        <div className='flex items-center justify-between'>
          <Text className='!m-0 !text-sm !text-zinc-400'>Price</Text>
          {isFixed && (
            <Text className='!m-0 !text-lg !font-semibold !text-zinc-100'>
              {formatMoney(ev.price, currency)}{' '}
              <span className='!text-sm !font-normal !text-zinc-400'>
                per ticket
              </span>
            </Text>
          )}
          {isFree && (
            <Text className='!m-0 !text-lg !font-semibold !text-zinc-100'>
              Free
            </Text>
          )}
          {isPWYW && (
            <Text className='!m-0 !text-sm !text-zinc-400'>
              Pay what you want (per ticket)
            </Text>
          )}
        </div>

        {/* PWYW controls */}
        {isPWYW && (
          <div className='mt-3 flex flex-wrap items-stretch gap-2'>
            <Button
              outline
              size='sm'
              className='!rounded-xl'
              onClick={() => {
                const next = Math.max(0, Number(pwywValue || 0) - pwywStep);
                setPwywValue(next);
                setPwywDraft(String(next));
              }}
            >
              −{pwywStep}
            </Button>
            <div className='w-32'>
              <Input
                type='text'
                inputMode='decimal'
                value={pwywDraft}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value
                    .replace(',', '.')
                    .replace(/[^0-9.]/g, '');
                  const parts = val.split('.');
                  const safe =
                    parts.length > 2
                      ? parts[0] + '.' + parts.slice(1).join('')
                      : val;
                  setPwywDraft(safe);
                }}
                onBlur={() => {
                  const n = Number(pwywDraft);
                  const cleaned = Number.isFinite(n) ? clamp(n, 0, 999999) : 0;
                  setPwywValue(cleaned);
                  setPwywDraft(String(cleaned));
                }}
                className='text-center'
              />
            </div>
            <Button
              outline
              size='sm'
              className='!rounded-xl'
              onClick={() => {
                const next = Math.max(0, Number(pwywValue || 0) + pwywStep);
                setPwywValue(next);
                setPwywDraft(String(next));
              }}
            >
              +{pwywStep}
            </Button>
            <div className='ml-2 self-center text-sm text-zinc-400'>
              {currency}
            </div>
            <div className='basis-full text-xs text-zinc-500'>
              Tip: set to 0 for a free ticket.
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className='mt-6 flex flex-wrap items-center gap-3'>
          <Text className='!m-0 !text-sm !text-zinc-400'>Quantity</Text>
          <Select
            name='quantity'
            value={String(qty)}
            onChange={(e) => setQty(parseInt(e.target.value, 10))}
            disabled={maxQty === 0}
          >
            {qtyOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
          <div className='ml-auto text-sm text-zinc-500'>
            {remaining}/{ev.capacity ?? 0} available (max 10 per order)
          </div>
        </div>

        {/* Total */}
        <div className='mt-4 flex items-center justify-between'>
          <Text className='!m-0 !text-sm !text-zinc-400'>Total</Text>
          <Text className='!m-0 !text-lg !font-semibold !text-zinc-100'>
            {isFree ? 'Free' : formatMoney(total, currency)}
          </Text>
        </div>

        {/* Action */}
        <div className='mt-6'>
          <Button
            onClick={handleBuy}
            disabled={!onSale || maxQty === 0 || busy || pwywTooLow}
            className='w-full rounded-2xl'
            color='indigo'
          >
            {busy
              ? 'Processing…'
              : isFree
              ? 'Get free tickets'
              : isPWYW && unitPrice === 0
              ? 'Get free tickets'
              : 'Buy ticket'}
          </Button>

          {pwywTooLow && (
            <div className='mt-2 text-xs text-red-400'>
              Minimum for card payments in {currency} is{' '}
              {formatMoney(minPaid, currency)}.
            </div>
          )}

          {!onSale && (
            <div className='mt-2 text-xs text-zinc-500'>
              This event is not available for purchase.
            </div>
          )}
        </div>
      </div>

      <AlertPopup
        isOpen={isAlertOpen}
        setIsOpen={setIsAlertOpen}
        title={alertTitle}
        description={alertMessage}
        confirmText='OK'
      />
    </div>
  );
}
