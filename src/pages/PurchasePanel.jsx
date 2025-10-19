// // src/components/checkout/PurchasePanel.jsx
// import { useMemo, useState } from 'react';

// import { Button } from '@/components/catalyst-ui-kit/button';
// import { Select } from '@/components/catalyst-ui-kit/select';
// import AlertPopup from '@/components/ui/AlertPopup';

// import { callCreateCheckoutSession } from '@/services/cloudFunctions';
// import { ticketsRemaining } from '@/utils/eventHelpers';

// export default function PurchasePanel({ ev }) {
//   const [qty, setQty] = useState(1);
//   const [busy, setBusy] = useState(false);
//   const [isAlertOpen, setIsAlertOpen] = useState(false);
//   const [alertTitle, setAlertTitle] = useState('');
//   const [alertMessage, setAlertMessage] = useState('');

//   const remaining = useMemo(() => ticketsRemaining(ev), [ev]);
//   const maxQty = Math.min(10, Math.max(0, remaining));

//   // Must be approved + published + have fixed price
//   const purchasable =
//     ev?.moderationStatus === 'approved' &&
//     ev?.publishStatus === 'published' &&
//     ev?.priceType === 'fixed' &&
//     typeof ev?.price === 'number' &&
//     maxQty > 0;

//   async function handleBuy() {
//     setBusy(true);
//     try {
//       const { url } = await callCreateCheckoutSession({
//         eventId: ev.id,
//         quantity: qty,
//       });
//       if (!url) throw new Error('No checkout URL returned by server.');
//       // Full page redirect to Stripe Checkout
//       window.location.assign(url);
//     } catch (e) {
//       setAlertTitle('Checkout failed');
//       setAlertMessage(
//         e?.message || 'Something went wrong while starting checkout.'
//       );
//       setIsAlertOpen(true);
//     } finally {
//       setBusy(false);
//     }
//   }

//   return (
//     <div className='rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 space-y-3'>
//       <div className='text-sm text-zinc-500'>Price</div>
//       <div className='text-lg font-semibold'>
//         {ev?.currency || 'USD'}{' '}
//         {typeof ev?.price === 'number' ? ev.price.toFixed(2) : '—'}
//       </div>

//       <div className='flex items-center gap-3'>
//         <Select
//           name='quantity'
//           value={String(qty)}
//           onChange={(e) => setQty(parseInt(e.target.value, 10))}
//           disabled={maxQty === 0}
//         >
//           {Array.from({ length: maxQty || 1 }, (_, i) => i + 1).map((n) => (
//             <option key={n} value={n}>
//               {n}
//             </option>
//           ))}
//         </Select>

//         <Button onClick={handleBuy} disabled={!purchasable || busy}>
//           {busy ? 'Redirecting…' : 'Buy ticket'}
//         </Button>
//       </div>

//       {!purchasable && (
//         <div className='text-xs text-zinc-500'>
//           {remaining <= 0
//             ? 'Sold out.'
//             : ev?.priceType !== 'fixed'
//             ? 'Card payments are not configured for this event.'
//             : ev?.publishStatus !== 'published' ||
//               ev?.moderationStatus !== 'approved'
//             ? 'This event is not available for purchase.'
//             : null}
//         </div>
//       )}

//       <AlertPopup
//         isOpen={isAlertOpen}
//         setIsOpen={setIsAlertOpen}
//         title={alertTitle}
//         description={alertMessage}
//         confirmText='OK'
//       />
//     </div>
//   );
// }
