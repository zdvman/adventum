// src/components/layout/AppLayout.jsx
import { Outlet } from 'react-router-dom';
import { StackedLayout } from '../catalyst-ui-kit/stacked-layout';
import { Sidebar } from '../catalyst-ui-kit/sidebar';
import Header from '@/components/layout/Header';

export default function AppLayout() {
  return (
    <StackedLayout
      navbar={<Header />}
      // sidebar={<Sidebar>{/* Your sidebar content */}</Sidebar>}
    >
      <Outlet /> {/* children routes render here */}
    </StackedLayout>
  );
}
