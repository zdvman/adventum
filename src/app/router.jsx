// src/app/router.jsx
import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import AuthLayout from '@/components/layout/AuthLayout';

import Home from '@/pages/Home';
import EventsIndex from '@/pages/EventsIndex';
import EventDetail from '@/pages/EventDetail';
import CreateEvent from '@/pages/CreateEvent';
import MyBookings from '@/pages/MyBookings';
import AuthPage from '@/pages/AuthPage';
import NotFound from '@/pages/NotFound';

import RequireAuth from '@/components/auth/RequireAuth';
import RequireStaff from '@/components/auth/RequireStaff';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/events', element: <EventsIndex /> },
      { path: '/events/:id', element: <EventDetail /> },
      {
        path: '/create',
        element: (
          <RequireAuth>
            <RequireStaff>
              <CreateEvent />
            </RequireStaff>
          </RequireAuth>
        ),
      },
      {
        path: '/my',
        element: (
          <RequireAuth>
            <MyBookings />
          </RequireAuth>
        ),
      },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    element: <AuthLayout />, // no header/footer
    children: [{ path: '/auth', element: <AuthPage /> }],
  },
]);
