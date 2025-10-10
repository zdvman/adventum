// src/pages/Order.jsx
import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Avatar } from '@/components/catalyst-ui-kit/avatar';
import { Badge } from '@/components/catalyst-ui-kit/badge';
import { Button } from '@/components/catalyst-ui-kit/button';
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from '@/components/catalyst-ui-kit/description-list';
import { Divider } from '@/components/catalyst-ui-kit/divider';
import { Heading, Subheading } from '@/components/catalyst-ui-kit/heading';
import { Link } from '@/components/catalyst-ui-kit/link';
import { getOrder } from './../../data/data.js';
import {
  BanknotesIcon,
  CalendarIcon,
  ChevronLeftIcon,
  CreditCardIcon,
} from '@heroicons/react/16/solid';
import { RefundOrder } from '@/components/ui/RefundOrder.jsx';

export default function Order() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getOrder(id);
        if (alive) setOrder(data || null);
      } catch (e) {
        if (alive) setErr(e?.message || 'Failed to load order');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading)
    return <div className='py-8 text-sm text-zinc-500'>Loading order…</div>;
  if (err) return <div className='py-8 text-sm text-red-500'>{err}</div>;
  if (!order) return <div className='text-center py-20'>Order not found</div>;

  return (
    <>
      <div className='mt-4 lg:mt-8'>
        <div className='flex items-center gap-4'>
          <Heading>Order #{order.id}</Heading>
          <Badge color='lime'>Successful</Badge>
        </div>
        <div className='isolate mt-2.5 flex flex-wrap justify-between gap-x-6 gap-y-4'>
          <div className='flex flex-wrap gap-x-10 gap-y-4 py-1.5'>
            <span className='flex items-center gap-3 text-base/6 text-zinc-950 sm:text-sm/6 dark:text-white'>
              <BanknotesIcon className='size-4 shrink-0 fill-zinc-400 dark:fill-zinc-500' />
              <span>US{order.amount.usd}</span>
            </span>
            <span className='flex items-center gap-3 text-base/6 text-zinc-950 sm:text-sm/6 dark:text-white'>
              <CreditCardIcon className='size-4 shrink-0 fill-zinc-400 dark:fill-zinc-500' />
              <span className='inline-flex gap-3'>
                {order.payment.card.type}{' '}
                <span>
                  <span aria-hidden='true'>••••</span>{' '}
                  {order.payment.card.number}
                </span>
              </span>
            </span>
            <span className='flex items-center gap-3 text-base/6 text-zinc-950 sm:text-sm/6 dark:text-white'>
              <CalendarIcon className='size-4 shrink-0 fill-zinc-400 dark:fill-zinc-500' />
              <span>{order.date}</span>
            </span>
          </div>
          <div className='flex gap-4'>
            <RefundOrder outline amount={order.amount.usd}>
              Refund
            </RefundOrder>
            <Button>Resend Invoice</Button>
          </div>
        </div>
      </div>

      <div className='mt-12'>
        <Subheading>Summary</Subheading>
        <Divider className='mt-4' />
        <DescriptionList>
          <DescriptionTerm>Customer</DescriptionTerm>
          <DescriptionDetails>{order.customer.name}</DescriptionDetails>

          <DescriptionTerm>Event</DescriptionTerm>
          <DescriptionDetails>
            <Link href={order.event.url} className='flex items-center gap-2'>
              <Avatar src={order.event.thumbUrl} className='size-6' />
              <span>{order.event.name}</span>
            </Link>
          </DescriptionDetails>

          <DescriptionTerm>Amount</DescriptionTerm>
          <DescriptionDetails>US{order.amount.usd}</DescriptionDetails>

          <DescriptionTerm>Amount after exchange rate</DescriptionTerm>
          <DescriptionDetails>
            US{order.amount.usd} &rarr; CA{order.amount.cad}
          </DescriptionDetails>

          <DescriptionTerm>Fee</DescriptionTerm>
          <DescriptionDetails>CA{order.amount.fee}</DescriptionDetails>

          <DescriptionTerm>Net</DescriptionTerm>
          <DescriptionDetails>CA{order.amount.net}</DescriptionDetails>
        </DescriptionList>
      </div>

      <div className='mt-12'>
        <Subheading>Payment method</Subheading>
        <Divider className='mt-4' />
        <DescriptionList>
          <DescriptionTerm>Transaction ID</DescriptionTerm>
          <DescriptionDetails>{order.payment.transactionId}</DescriptionDetails>

          <DescriptionTerm>Card number</DescriptionTerm>
          <DescriptionDetails>
            •••• {order.payment.card.number}
          </DescriptionDetails>

          <DescriptionTerm>Card type</DescriptionTerm>
          <DescriptionDetails>{order.payment.card.type}</DescriptionDetails>

          <DescriptionTerm>Card expiry</DescriptionTerm>
          <DescriptionDetails>{order.payment.card.expiry}</DescriptionDetails>

          <DescriptionTerm>Owner</DescriptionTerm>
          <DescriptionDetails>{order.customer.name}</DescriptionDetails>

          <DescriptionTerm>Email address</DescriptionTerm>
          <DescriptionDetails>{order.customer.email}</DescriptionDetails>

          <DescriptionTerm>Address</DescriptionTerm>
          <DescriptionDetails>{order.customer.address}</DescriptionDetails>

          <DescriptionTerm>Country</DescriptionTerm>
          <DescriptionDetails>
            <span className='inline-flex gap-3'>
              <img
                src={order.customer.countryFlagUrl}
                alt={order.customer.country}
              />
              {order.customer.country}
            </span>
          </DescriptionDetails>

          <DescriptionTerm>CVC</DescriptionTerm>
          <DescriptionDetails>
            <Badge color='lime'>Passed successfully</Badge>
          </DescriptionDetails>
        </DescriptionList>
      </div>
    </>
  );
}
