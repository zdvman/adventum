// src/components/layout/AppLayout.jsx
import { Outlet, useLocation } from 'react-router-dom';
import { StackedLayout } from '@/components/catalyst-ui-kit/stacked-layout';
import Header from '@/components/layout/Header';
import SidebarBlock from './SidebarBlock';
import { useAuth } from '@/contexts/useAuth';
import AlertPopup from '@/components/ui/AlertPopup';
import { useEffect } from 'react';

const mainMenuNavItems = [
  {
    label: 'Find Events',
    url: '/events',
    exclude: ['/events/new', '/events/:id', '/events/*/edit'],
  },
  { label: 'Create Event', url: '/events/new' },
];

export default function AppLayout() {
  const { error, setError } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (error) setError(null);
  }, [location.pathname]);

  return (
    <>
      <StackedLayout
        navbar={<Header mainMenuNavItems={mainMenuNavItems} />}
        sidebar={<SidebarBlock mainMenuNavItems={mainMenuNavItems} />}
      >
        <Outlet />
      </StackedLayout>
      {error && (
        <AlertPopup
          isOpen={!!error}
          setIsOpen={() => setError(null)}
          title='Authentication error'
          description={error}
          confirmText='OK'
        />
      )}
    </>
  );
}
