// src/components/layout/AppLayout.jsx
import { Outlet } from 'react-router-dom';
import { StackedLayout } from '../catalyst-ui-kit/stacked-layout';
import { Sidebar } from '../catalyst-ui-kit/sidebar';
import Header from '@/components/layout/Header';
import SidebarBlock from './SidebarBlock';

const mainMenuNavItems = [
  { label: 'Home', url: '/' },
  { label: 'Events', url: '/events' },
  { label: 'Orders', url: '/orders' },
];

// const staffMenuNavItems = [
//   { label: 'Create Event', url: '/create-event' },
//   { label: 'Delete Event', url: '/delete-event' },
// ];

export default function AppLayout() {
  return (
    <StackedLayout
      navbar={
        <Header
          mainMenuNavItems={mainMenuNavItems}
          // staffMenuNavItems={staffMenuNavItems}
        />
      }
      sidebar={
        <SidebarBlock
          mainMenuNavItems={mainMenuNavItems}
          // staffMenuNavItems={staffMenuNavItems}
        />
      }
    >
      <Outlet /> {/* children routes render here */}
    </StackedLayout>
  );
}
