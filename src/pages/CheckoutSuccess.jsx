// src/pages/CheckoutSuccess.jsx
import { useEffect, useState } from 'react';
import {
  useNavigate,
  useSearchParams,
  Link as RouterLink,
} from 'react-router-dom';
import { Button } from '@/components/catalyst-ui-kit/button';
import { Heading } from '@/components/catalyst-ui-kit/heading';
import { Text, Strong, TextLink } from '@/components/catalyst-ui-kit/text';
import Loading from '@/components/ui/Loading';
import AlertPopup from '@/components/ui/AlertPopup';
import { formatMoney } from '@/utils/eventHelpers';
import { callFinalizeCheckoutSession } from '@/services/cloudFunctions';

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const sessionId = params.get('session_id') || '';
  const [busy, setBusy] = useState(true);
  const [order, setOrder] = useState(null);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [copied, setCopied] = useState(false);

  function shortId(id, head = 6, tail = 6) {
    if (!id) return '';
    if (id.length <= head + tail + 1) return id;
    return `${id.slice(0, head)}…${id.slice(-tail)}`;
  }

  async function handleCopyFullId() {
    try {
      await navigator.clipboard.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      console.error('Could not copy order id to clipboard', e);
    }
  }

  useEffect(() => {
    let ignore = false;
    async function run() {
      if (!sessionId) {
        setAlertTitle('Missing session');
        setAlertMessage('Checkout session id is not present.');
        setIsAlertOpen(true);
        setBusy(false);
        return;
      }
      setBusy(true);
      try {
        const { order: o } = await callFinalizeCheckoutSession(sessionId);
        if (!ignore) setOrder(o || null);
      } catch (e) {
        if (!ignore) {
          setAlertTitle('Could not finalize payment');
          setAlertMessage(e?.message || 'Please contact support.');
          setIsAlertOpen(true);
        }
      } finally {
        if (!ignore) setBusy(false);
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, [sessionId]);

  if (busy) return <Loading label='Finalizing your order…' />;

  if (!order) {
    return (
      <div className='mx-auto max-w-2xl px-4 py-12 text-center text-zinc-100'>
        <Heading>We couldn’t find your order</Heading>
        <Text className='!mt-2 !text-zinc-400'>
          If you were charged, please contact support with your Stripe receipt
          email.
        </Text>
        <div className='mt-6'>
          <Button onClick={() => navigate('/')}>Go home</Button>
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

  const total = typeof order.total === 'number' ? order.total : 0;
  const prettyId = order?.orderCode
    ? `#${order.orderCode}`
    : shortId(order?.id);
  const viewOrderUrl = `/account/orders/${order.id}`;

  return (
    <div className='mx-auto max-w-2xl px-4 py-12 text-zinc-100'>
      <Heading className='text-3xl md:text-4xl'>
        <Strong>Payment successful</Strong>
      </Heading>
      <Text className='!mt-2 !text-zinc-400'>
        Your order has been confirmed.
      </Text>

      <div className='mt-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-6'>
        <div className='flex items-center justify-between'>
          <Text className='!m-0 !text-sm !text-zinc-400'>Order ID</Text>
          <div className='flex items-center gap-2'>
            <Text className='!m-0 !text-sm !text-zinc-200'>{prettyId}</Text>

            {order?.id && (
              <>
                <button
                  className='text-xs text-zinc-400 hover:text-zinc-200 underline'
                  onClick={handleCopyFullId}
                  title='Copy full id'
                  aria-label='Copy full order id'
                >
                  copy full id
                </button>
                {copied && (
                  <span className='text-xs text-emerald-400' aria-live='polite'>
                    Copied!
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div className='mt-3 flex items-center justify-between'>
          <Text className='!m-0 !text-sm !text-zinc-400'>Event</Text>
          <RouterLink
            to={`/events/${order.eventId}`}
            className='text-indigo-400 hover:underline'
          >
            View event
          </RouterLink>
        </div>
        <div className='mt-3 flex items-center justify-between'>
          <Text className='!m-0 !text-sm !text-zinc-400'>Quantity</Text>
          <Text className='!m-0 !text-sm !text-zinc-200'>{order.quantity}</Text>
        </div>
        <div className='mt-3 flex items-center justify-between'>
          <Text className='!m-0 !text-sm !text-zinc-400'>Total</Text>
          <Text className='!m-0 !text-lg !font-semibold !text-zinc-100'>
            {formatMoney(total, order.currency || 'USD')}
          </Text>
        </div>
        {order.status === 'paid_over_capacity' && (
          <div className='mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200'>
            Your payment succeeded but the event is sold out. We’ll contact you
            and issue a refund.
          </div>
        )}
        <div className='mt-6 flex flex-wrap gap-3'>
          <Button href={`/events/${order.eventId}`} color='zinc' outline>
            Back to event
          </Button>
          <Button href={viewOrderUrl} color='indigo'>
            View order
          </Button>
          <Button href='/account/orders' color='indigo' outline>
            View my orders
          </Button>
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
