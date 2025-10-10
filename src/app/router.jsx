// src/app/router.jsx
import { createBrowserRouter, redirect } from 'react-router-dom';
import AuthLayout from '@/components/layout/AuthLayout';

import Home from '@/pages/Home';
import EventsIndex from '@/pages/EventsIndex';
import EventDetail from '@/pages/EventDetail';
import CreateEvent from '@/pages/CreateEvent';
import MyEvents from '@/pages/MyEvents';
import NotFound from '@/pages/NotFound';

import RequireAuth from '@/components/auth/RequireAuth';
import AppLayout from '@/components/layout/AppLayout';
import CheckoutStart from '@/pages/CheckoutStart';
import CheckoutSuccess from '@/pages/CheckoutSuccess';
import CheckoutCancel from '@/pages/CheckoutCancel';
import AccountSettings from '@/pages/AccountSettings';
import AuthSignUp from '@/pages/AuthSignUp';
import AuthSignIn from '@/pages/AuthSignIn';
import AuthResetPassword from '@/pages/AuthResetPassword';
import DevSeed from '@/pages/DevSeed';
import Orders from '@/pages/Orders';
import Order from '@/pages/Order';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <Home /> },

      // Public events catalogue
      { path: '/events', element: <EventsIndex /> },
      { path: '/events/:idSlug', element: <EventDetail /> },

      // Create (signed-in)
      {
        path: '/events/new',
        element: (
          <RequireAuth>
            <CreateEvent />
          </RequireAuth>
        ),
      },

      // (Optional) Edit page − protect inside the page by checking ownership/staff
      // { path: '/events/:id/edit', element: <RequireAuth><EditEvent /></RequireAuth> },

      // “My” section aliases
      {
        path: '/my',
        element: (
          <RequireAuth>
            <Orders />
          </RequireAuth>
        ),
      },

      // Account hub (nested)
      {
        path: 'account',
        children: [
          { index: true, loader: () => redirect('/account/events') },
          {
            path: 'events',
            element: (
              <RequireAuth>
                <MyEvents />
              </RequireAuth>
            ),
          },
          {
            path: 'orders',
            element: (
              <RequireAuth>
                <Orders />
              </RequireAuth>
            ),
          },
          {
            path: 'orders/:id',
            element: (
              <RequireAuth>
                <Order />
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

      // Checkout
      {
        path: '/checkout',
        children: [
          { path: ':idSlug', element: <CheckoutStart /> },
          { path: 'success', element: <CheckoutSuccess /> },
          { path: 'cancel', element: <CheckoutCancel /> },
        ],
      },

      // Misc
      { path: '/dev/seed', element: <DevSeed /> },
      { path: '/404', element: <NotFound /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/auth/sign-in', element: <AuthSignIn /> },
      { path: '/auth/sign-up', element: <AuthSignUp /> },
      { path: '/auth/reset', element: <AuthResetPassword /> },
    ],
  },
]);
