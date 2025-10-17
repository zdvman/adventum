// src/pages/UsersIndexStaff.jsx
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/useAuth';

import { Heading } from '@/components/catalyst-ui-kit/heading';
import { Input, InputGroup } from '@/components/catalyst-ui-kit/input';
import { Select } from '@/components/catalyst-ui-kit/select';
import { Button } from '@/components/catalyst-ui-kit/button';
import { Badge } from '@/components/catalyst-ui-kit/badge';
import { Link } from '@/components/catalyst-ui-kit/link';
import { Strong, Text } from '@/components/catalyst-ui-kit/text';
import { Divider } from '@/components/catalyst-ui-kit/divider';
import Loading from '@/components/ui/Loading';
import AlertPopup from '@/components/ui/AlertPopup';

import {
  subscribeAllProfilesForStaff,
  sortStaffProfiles,
  staffSetUserBlocked,
  staffSetUserRole,
  staffDeleteUserCascade,
} from '@/services/api';

import {
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/16/solid';
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from '@/components/catalyst-ui-kit/dropdown';

export default function UsersIndexStaff() {
  const { profile: myProfile } = useAuth();
  const isStaff = myProfile?.role === 'staff';

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [q, setQ] = useState('');
  const [searchBy, setSearchBy] = useState('any'); // any|name|username|email|uid
  const [roleFilter, setRoleFilter] = useState('all'); // all|member|staff
  const [statusFilter, setStatusFilter] = useState('all'); // all|active|blocked

  const [busyId, setBusyId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const searchPlaceholder =
    searchBy === 'name'
      ? 'Search by name…'
      : searchBy === 'username'
      ? 'Search by username…'
      : searchBy === 'email'
      ? 'Search by email…'
      : searchBy === 'uid'
      ? 'Search by UID…'
      : 'Search users…';

  useEffect(() => {
    if (!isStaff) return;
    let ignore = false;

    const unsub = subscribeAllProfilesForStaff((list) => {
      if (ignore) return;
      list.sort(sortStaffProfiles);
      setProfiles(list);
      setLoading(false);
    });

    return () => {
      ignore = true;
      if (typeof unsub === 'function') unsub();
    };
  }, [isStaff]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const norm = (v) => (v == null ? '' : String(v)).toLowerCase();

    return profiles.filter((p) => {
      // role / status gates
      if (roleFilter !== 'all' && (p.role || 'member') !== roleFilter)
        return false;
      if (statusFilter === 'active' && !!p.blocked) return false;
      if (statusFilter === 'blocked' && !p.blocked) return false;

      // no search text => pass
      if (!term) return true;

      // field-specific matching
      if (searchBy === 'uid') {
        // exact match on UID (case-insensitive equality)
        return norm(p.id) === term;
      }

      if (searchBy === 'email') {
        return norm(p.email).includes(term);
      }

      if (searchBy === 'username') {
        return norm(p.username).includes(term);
      }

      if (searchBy === 'name') {
        const first = norm(p.firstName);
        const last = norm(p.lastName);
        const full = `${first} ${last}`.trim();
        const fullRev = `${last} ${first}`.trim();
        // match "john", "john d", "doe j", "john doe", etc.
        return (
          first.includes(term) ||
          last.includes(term) ||
          full.includes(term) ||
          fullRev.includes(term)
        );
      }

      // 'any' (default): previous broad haystack search
      const hay = [
        p.firstName || '',
        p.lastName || '',
        p.username || '',
        p.email || '',
        p.id,
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(term);
    });
  }, [profiles, q, searchBy, roleFilter, statusFilter]);

  if (!isStaff) return null;
  if (loading) return <Loading label='Loading users…' />;

  async function toggleBlocked(p) {
    setBusyId(p.id);
    try {
      await staffSetUserBlocked(p.id, !p.blocked);
    } catch (e) {
      setAlertTitle('Update failed');
      setAlertMessage(e?.message || 'Could not change block status.');
      setIsAlertOpen(true);
    } finally {
      setBusyId(null);
    }
  }

  async function flipRole(p) {
    setBusyId(p.id);
    try {
      const next = p.role === 'staff' ? 'member' : 'staff';
      await staffSetUserRole(p.id, next);
    } catch (e) {
      setAlertTitle('Role change failed');
      setAlertMessage(e?.message || 'Could not change role.');
      setIsAlertOpen(true);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(p) {
    if (p.id === myProfile?.id) {
      setAlertTitle('Not allowed');
      setAlertMessage('You cannot delete your own account.');
      setIsAlertOpen(true);
      return;
    }
    const ok = confirm(
      `Permanently delete “${
        p.username || p.firstName || p.id
      }”? This will remove the user, all their events, and related orders.`
    );
    if (!ok) return;

    setDeletingId(p.id);
    try {
      const res = await staffDeleteUserCascade(p.id);
      setAlertTitle('User deleted');
      setAlertMessage(
        `Cascade removed. Events: ${
          res?.summary?.eventsDeleted ?? 0
        }, Orders: ${res?.summary?.ordersDeleted ?? 0}`
      );
      setIsAlertOpen(true);
      // realtime listener will drop the row
    } catch (e) {
      setAlertTitle('Delete failed');
      setAlertMessage(e?.message || 'Could not delete this user.');
      setIsAlertOpen(true);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div className='max-sm:w-full sm:flex-1'>
          <Heading>Users (staff)</Heading>
          <div className='mt-4 flex max-w-3xl flex-wrap gap-4'>
            <div className='min-w-[240px] flex-1'>
              <InputGroup>
                <MagnifyingGlassIcon />
                <Input
                  name='search'
                  placeholder={searchPlaceholder}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </InputGroup>
            </div>
            <div>
              <Select
                name='search_by'
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
              >
                <option value='any'>Search: Any</option>
                <option value='name'>Name</option>
                <option value='username'>Username</option>
                <option value='email'>Email</option>
                <option value='uid'>UID</option>
              </Select>
            </div>
            <div>
              <Select
                name='role'
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value='all'>All roles</option>
                <option value='member'>Member</option>
                <option value='staff'>Staff</option>
              </Select>
            </div>
            <div>
              <Select
                name='status'
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value='all'>All statuses</option>
                <option value='active'>Active</option>
                <option value='blocked'>Blocked</option>
              </Select>
            </div>
          </div>
        </div>
        <Button href='/events/new'>Create event</Button>
      </div>

      {rows.length === 0 ? (
        <div className='mt-10 rounded-xl border border-zinc-800 p-6 text-sm text-zinc-400'>
          No users match your filters.
        </div>
      ) : (
        <ul className='mt-10'>
          {rows.map((p, idx) => (
            <li key={p.id}>
              <Divider soft={idx > 0} />
              <div className='flex items-center justify-between py-4'>
                <div className='flex items-center gap-4'>
                  <img
                    src={p.avatar || '/avatars/incognito.png'}
                    alt=''
                    className='h-12 w-12 rounded-full object-cover'
                  />
                  <div className='space-y-0.5'>
                    <Link href={`/staff/users/${p.id}/edit`}>
                      <Strong>
                        {(p.firstName || '') +
                          (p.lastName ? ` ${p.lastName}` : '') ||
                          p.username ||
                          p.id}
                      </Strong>
                    </Link>
                    <div className='text-xs text-zinc-500'>
                      {p.username || '—'}
                    </div>
                    <div className='mt-1 flex gap-2'>
                      <Badge color={p.role === 'staff' ? 'indigo' : 'zinc'}>
                        {p.role === 'staff' ? 'Staff' : 'Member'}
                      </Badge>
                      {p.blocked && <Badge color='red'>Blocked</Badge>}
                    </div>
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  {/* ACTIONS — mobile ellipsis + desktop "Actions" */}
                  <div className='sm:hidden'>
                    <Dropdown>
                      <DropdownButton plain aria-label='More options'>
                        <EllipsisVerticalIcon className='w-5 h-5' />
                      </DropdownButton>
                      <DropdownMenu anchor='bottom end'>
                        <DropdownItem href={`/staff/users/${p.id}/edit`}>
                          Manage
                        </DropdownItem>

                        <DropdownItem
                          as='button'
                          onClick={() => flipRole(p)}
                          disabled={busyId === p.id || deletingId === p.id}
                        >
                          {busyId === p.id
                            ? 'Working…'
                            : p.role === 'staff'
                            ? 'Set member'
                            : 'Make staff'}
                        </DropdownItem>

                        <DropdownItem
                          as='button'
                          onClick={() => toggleBlocked(p)}
                          disabled={busyId === p.id || deletingId === p.id}
                        >
                          {busyId === p.id
                            ? 'Working…'
                            : p.blocked
                            ? 'Unblock'
                            : 'Block'}
                        </DropdownItem>

                        <DropdownItem
                          as='button'
                          onClick={() => handleDelete(p)}
                          disabled={deletingId === p.id}
                        >
                          {deletingId === p.id ? 'Deleting…' : 'Delete'}
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>

                  <div className='hidden sm:block'>
                    <Dropdown>
                      <DropdownButton size='sm' color='zinc'>
                        Actions
                      </DropdownButton>
                      <DropdownMenu anchor='bottom end'>
                        <DropdownItem href={`/staff/users/${p.id}/edit`}>
                          Manage
                        </DropdownItem>

                        <DropdownItem
                          as='button'
                          onClick={() => flipRole(p)}
                          disabled={busyId === p.id || deletingId === p.id}
                        >
                          {busyId === p.id
                            ? 'Working…'
                            : p.role === 'staff'
                            ? 'Set member'
                            : 'Make staff'}
                        </DropdownItem>

                        <DropdownItem
                          as='button'
                          onClick={() => toggleBlocked(p)}
                          disabled={busyId === p.id || deletingId === p.id}
                        >
                          {busyId === p.id
                            ? 'Working…'
                            : p.blocked
                            ? 'Unblock'
                            : 'Block'}
                        </DropdownItem>

                        <DropdownItem
                          as='button'
                          onClick={() => handleDelete(p)}
                          disabled={deletingId === p.id}
                        >
                          {deletingId === p.id ? 'Deleting…' : 'Delete'}
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {(busyId || deletingId) && (
        <Loading label={deletingId ? 'Deleting…' : 'Updating…'} />
      )}

      <AlertPopup
        isOpen={isAlertOpen}
        setIsOpen={setIsAlertOpen}
        title={alertTitle}
        description={alertMessage}
        confirmText='OK'
      />
    </>
  );
}
