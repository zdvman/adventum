// src/pages/CheckoutStart.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';

import { Button } from '@/components/catalyst-ui-kit/button';
import { Select } from '@/components/catalyst-ui-kit/select';
import { Heading } from '@/components/catalyst-ui-kit/heading';
import { Text, Strong } from '@/components/catalyst-ui-kit/text';

import AlertPopup from '@/components/ui/AlertPopup';
import Loading from '@/components/ui/Loading';

import { callCreateCheckoutSession } from '@/services/cloudFunctions';
import { ticketsRemaining } from '@/utils/eventHelpers';
import { getEventByIdServer } from '@/services/api';

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

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  // Load the event fresh from server (bypasses cache) so we respect current rules
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
        // If rules forbid reading the document for the current viewer
        if (!ignore) setGuard('forbidden');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    // wait until auth init completes (so we know if user is logged in)
    if (!initializing) load();

    return () => {
      ignore = true;
    };
  }, [eventId, initializing]);

  if (initializing || loading) return <Loading label='Loading checkout…' />;

  if (guard === 'notfound') {
    return (
      <div className='py-16 text-center'>
        <Heading>Event not found</Heading>
        <Text className='!mt-2'>Please check the link and try again.</Text>
      </div>
    );
  }
  if (guard === 'forbidden') {
    return (
      <div className='py-16 text-center'>
        <Heading>Access denied</Heading>
        <Text className='!mt-2'>
          You do not have permission to view this event.
        </Text>
      </div>
    );
  }
  if (!ev) return null;

  // Derived
  const remaining = ticketsRemaining(ev || {});
  const maxQty = Math.min(10, Math.max(0, remaining));

  // Only fixed-price & approved+published allowed in our MVP checkout
  const purchasable =
    ev?.moderationStatus === 'approved' &&
    ev?.publishStatus === 'published' &&
    ev?.priceType === 'fixed' &&
    typeof ev?.price === 'number' &&
    maxQty > 0;

  async function handleBuy() {
    // Must be logged in because the callable reads context.auth.uid
    if (!user) {
      const redir = encodeURIComponent(location.pathname);
      navigate(`/login?redirect=${redir}`);
      return;
    }

    setBusy(true);
    try {
      const { url } = await callCreateCheckoutSession({
        eventId: ev.id,
        quantity: qty,
      });
      if (!url) throw new Error('No checkout URL returned by server.');
      window.location.assign(url); // redirect to Stripe Checkout
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

  return (
    <div className='mx-auto max-w-2xl px-4 py-10'>
      <Heading>
        <Strong>Checkout</Strong>
      </Heading>
      <Text className='!mt-2 !text-zinc-500'>
        You’re purchasing tickets for <Strong>{ev.title}</Strong>
      </Text>

      <div className='mt-6 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800'>
        <div className='text-sm text-zinc-500'>Price</div>
        <div className='text-lg font-semibold'>
          {ev?.currency || 'USD'}{' '}
          {typeof ev?.price === 'number' ? ev.price.toFixed(2) : '—'}
        </div>

        <div className='mt-4 flex items-center gap-3'>
          <Select
            name='quantity'
            value={String(qty)}
            onChange={(e) => setQty(parseInt(e.target.value, 10))}
            disabled={maxQty === 0}
          >
            {Array.from({ length: maxQty || 1 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>

          <Button onClick={handleBuy} disabled={!purchasable || busy}>
            {busy ? 'Redirecting…' : 'Buy ticket'}
          </Button>
        </div>

        {!purchasable && (
          <div className='mt-2 text-xs text-zinc-500'>
            {remaining <= 0
              ? 'Sold out.'
              : ev?.priceType !== 'fixed'
              ? 'Card payments are not configured for this event.'
              : ev?.publishStatus !== 'published' ||
                ev?.moderationStatus !== 'approved'
              ? 'This event is not available for purchase.'
              : null}
          </div>
        )}

        <div className='mt-4 text-xs text-zinc-500'>
          {remaining}/{ev.capacity ?? 0} available
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
