// src/pages/Orders.jsx
import { useEffect, useState } from 'react';
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
import { getOrders } from '../../data/data.js';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getOrders();
        if (alive) setOrders(data || []);
      } catch (e) {
        if (alive) setErr(e?.message || 'Failed to load orders');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading)
    return <div className='py-8 text-sm text-zinc-500'>Loading orders…</div>;
  if (err) return <div className='py-8 text-sm text-red-500'>{err}</div>;

  return (
    <>
      <div className='flex items-end justify-between gap-4'>
        <Heading>Orders</Heading>
        <Button className='-my-0.5'>Create order</Button>
      </div>

      <Table className='mt-8 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]'>
        <TableHead>
          <TableRow>
            <TableHeader>Order number</TableHeader>
            <TableHeader>Purchase date</TableHeader>
            <TableHeader>Customer</TableHeader>
            <TableHeader>Event</TableHeader>
            <TableHeader className='text-right'>Amount</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order.id}
              href={`/account/orders/${order.id}`} // navigates to detail page
              title={`Order #${order.id}`}
            >
              <TableCell>{order.id}</TableCell>
              <TableCell className='text-zinc-500'>{order.date}</TableCell>
              <TableCell>{order.customer.name}</TableCell>
              <TableCell>
                <div className='flex items-center gap-2'>
                  <Avatar src={order.event.thumbUrl} className='size-6' />
                  <span>{order.event.name}</span>
                </div>
              </TableCell>
              <TableCell className='text-right'>US{order.amount.usd}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
