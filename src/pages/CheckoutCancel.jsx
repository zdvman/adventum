// src/pages/CheckoutCancel.jsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/catalyst-ui-kit/button';
import { Heading } from '@/components/catalyst-ui-kit/heading';
import { Text } from '@/components/catalyst-ui-kit/text';

export default function CheckoutCancel() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const eventId = params.get('event');

  useEffect(() => {
    // optional: you could record analytics here
  }, []);

  return (
    <div className='mx-auto max-w-2xl px-4 py-12 text-zinc-100 text-center'>
      <Heading>Payment canceled</Heading>
      <Text className='!mt-2 !text-zinc-400'>
        Your payment was canceled. You can try again anytime.
      </Text>
      <div className='mt-6 flex justify-center gap-3'>
        {eventId ? (
          <Button
            onClick={() => navigate(`/events/${eventId}`)}
            color='zinc'
            outline
          >
            Back to event
          </Button>
        ) : null}
        <Button onClick={() => navigate('/')} color='indigo'>
          Go home
        </Button>
      </div>
    </div>
  );
}
