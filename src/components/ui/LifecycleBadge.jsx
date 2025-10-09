import { computeLifecycle } from '@/utils/eventHelpers';
import { Badge } from '../catalyst-ui-kit/badge';

export function LifecycleBadge({ ev }) {
  const state = computeLifecycle(ev);
  const map = {
    pending: { label: 'Pending review', color: 'amber' },
    rejected: { label: 'Rejected', color: 'red' },
    draft: { label: 'Draft', color: 'zinc' },
    upcoming: { label: 'Upcoming', color: 'blue' },
    live: { label: 'Live', color: 'indigo' },
    ended: { label: 'Ended', color: 'zinc' },
  };
  const { label, color } = map[state] ?? { label: state, color: 'zinc' };
  return <Badge color={color}>{label}</Badge>;
}
