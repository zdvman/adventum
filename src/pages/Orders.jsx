import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';

import { Avatar } from '@/components/catalyst-ui-kit/avatar';
import { Button } from '@/components/catalyst-ui-kit/button';
import { Heading } from '@/components/catalyst-ui-kit/heading';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/catalyst-ui-kit/table';
import Loading from '@/components/ui/Loading';

import { getMyOrders, getEventsByIds } from '@/services/api';
import { formatMoney } from '@/utils/eventHelpers';

function prettyId(order) {
  if (!order) return '';
  return order.orderCode ? `#${order.orderCode}` : order.id || '';
}

export default function Orders() {
  const { user, initializing } = useAuth();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!user) {
        setRows([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setErr(null);
      try {
        const orders = await getMyOrders(user.uid, { limitTo: 100 });
        const evMap = await getEventsByIds(orders.map((o) => o.eventId));

        const mapped = orders.map((o) => {
          const ev = evMap[o.eventId] || {};
          const dt =
            o.createdAt?.toDate?.() ||
            (o.createdAt ? new Date(o.createdAt) : null);
          const date = dt
            ? dt.toLocaleString(undefined, {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—';
          return {
            id: o.id,
            code: prettyId(o),
            date,
            eventId: o.eventId,
            eventTitle: ev.title || 'Event',
            eventImage: ev.image || '',
            amount: formatMoney(o.total || 0, o.currency || 'USD'),
          };
        });

        if (alive) setRows(mapped);
      } catch (e) {
        if (alive) setErr(e?.message || 'Failed to load orders');
      } finally {
        if (alive) setLoading(false);
      }
    }
    if (!initializing) run();
    return () => {
      alive = false;
    };
  }, [user, initializing]);

  if (initializing || loading) return <Loading label='Loading orders…' />;
  if (err) return <div className='py-8 text-sm text-red-500'>{err}</div>;

  return (
    <>
      <div className='flex items-end justify-between gap-4'>
        <Heading>Orders</Heading>
        <Button color='zinc' outline onClick={() => navigate('/events')}>
          Find events
        </Button>
      </div>

      <Table className='mt-8 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]'>
        <TableHead>
          <TableRow>
            <TableHeader>Order</TableHeader>
            <TableHeader>Purchase date</TableHeader>
            <TableHeader>Event</TableHeader>
            <TableHeader className='text-right'>Total</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow
              key={r.id}
              href={`/account/orders/${r.id}`}
              title={`Order ${r.code}`}
            >
              <TableCell className='font-medium'>{r.code}</TableCell>
              <TableCell className='text-zinc-500'>{r.date}</TableCell>
              <TableCell>
                <div className='flex items-center gap-2'>
                  {r.eventImage ? (
                    <Avatar src={r.eventImage} className='size-6' />
                  ) : null}
                  <span>{r.eventTitle}</span>
                </div>
              </TableCell>
              <TableCell className='text-right'>{r.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
