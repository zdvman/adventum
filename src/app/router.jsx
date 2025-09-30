// src/app/router.jsx
import { createBrowserRouter, redirect } from 'react-router-dom';
import AuthLayout from '@/components/layout/AuthLayout';

import Home from '@/pages/Home';
import EventsIndex from '@/pages/EventsIndex';
import EventDetail from '@/pages/EventDetail';
import CreateEvent from '@/pages/CreateEvent';
import MyBookings from '@/pages/MyBookings';
import NotFound from '@/pages/NotFound';

import RequireAuth from '@/components/auth/RequireAuth';
import RequireStaff from '@/components/auth/RequireStaff';
import AppLayout from '@/components/layout/AppLayout';
import CheckoutStart from '@/pages/CheckoutStart';
import CheckoutSuccess from '@/pages/CheckoutSuccess';
import CheckoutCancel from '@/pages/CheckoutCancel';
import AccountSettings from '@/pages/AccountSettings';
import AuthSignUp from '@/pages/AuthSignUp';
import AuthSignIn from '@/pages/AuthSignIn';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/events', element: <EventsIndex /> },
      { path: '/events/:id', element: <EventDetail /> },
      {
        path: '/events/new',
        element: (
          <RequireAuth>
            <CreateEvent />
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
      {
        path: 'account',
        children: [
          { index: true, loader: () => redirect('/account/tickets') },
          {
            path: 'tickets',
            element: (
              <RequireAuth>
                <MyBookings />
              </RequireAuth>
            ),
          },
          {
            path: 'settings',
            element: (
              <RequireAuth>
                <AccountSettings />
              </RequireAuth>
            ),
          },
        ],
      },

      { path: 'checkout/:eventId', element: <CheckoutStart /> },
      { path: 'checkout/success', element: <CheckoutSuccess /> },
      { path: 'checkout/cancel', element: <CheckoutCancel /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    element: <AuthLayout />, // no header/footer
    children: [
      { path: '/auth/sign-in', element: <AuthSignIn /> },
      { path: '/auth/sign-up', element: <AuthSignUp /> },
    ],
  },
]);
