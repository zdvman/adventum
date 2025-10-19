# Adventum — community events platform

**Live demo:** [https://adventum-project.vercel.app/](https://adventum-project.vercel.app/)

A simple events platform where creators (staff or members) can publish events and attendees can reserve free or paid tickets. It includes moderation, capacity tracking, Stripe checkout, Google-Calendar add links, address autocomplete (OpenStreetMap), and a staff dashboard.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Data model](#data-model)
- [Security (Firestore rules)](#security-firestore-rules)
- [Environments & configuration](#environments--configuration)

  - [Frontend (`.env.local`)](#frontend-envlocal)
  - [Cloud Functions (`functions/.env.*`)](#cloud-functions-functionsenv)
  - [Why redirects work locally **and** on Vercel](#why-redirects-work-locally-and-on-vercel)

- [Local development](#local-development)
- [Deploy](#deploy)

  - [Deploy UI (Vercel)](#deploy-ui-vercel)
  - [Deploy Cloud Functions](#deploy-cloud-functions)
  - [Deploy Firestore rules](#deploy-firestore-rules)

- [Seeding sample data](#seeding-sample-data)
- [User roles & permissions](#user-roles--permissions)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [License](#license)

---

## Features

- **Browse & search events** — upcoming, live, ended; category/venue metadata.
- **Create & edit events** with:

  - `publishStatus`: `draft` / `published`
  - `moderationStatus`: `pending` / `approved` / `rejected`
  - Pricing: `free` / `payWhatYouWant` / `fixed`
  - Capacity & **tickets sold** → automatic “spots left” / sold out.

- **Moderation workflow** — staff can approve/reject. Re-publishing approved events only goes back to _pending_ if content changed (content hash).
- **Stripe Checkout** for paid/PWYW (amount >= currency minimums).
  Free and PWYW=0 orders go through the **free order** path.
- **Orders** — idempotent creation, pretty order codes (`000123`), capacity increment in a transaction.
- **Add to Google Calendar** from the event page.
- **Address autocomplete** (no maps required): OpenStreetMap **Nominatim** suggestions with normalized address fields.
- **Auth** — Email/Password and Google; “remember me” (local/session storage) with cookie-consent banner.
- **Account** — profile settings, change email/password, delete account (server-side checks prevent deleting if user has events or orders).
- **Staff area** — manage events/users (block/unblock, promote to staff).
- **Responsive UI** — Tailwind + Headless UI + Heroicons.

---

## Tech stack

**Frontend**

- React 19 (RC), Vite 7
- React Router 7
- Tailwind CSS 4 (via `@tailwindcss/vite`)
- Headless UI, Heroicons
- Stripe JS (`@stripe/stripe-js`)
- (Optional) Leaflet / React-Leaflet are present, but **address autocomplete does not need a map**.

**Backend**

- Firebase Authentication
- Cloud Firestore
- Cloud Functions v2 (Node 18+)
- Stripe server SDK
- OpenStreetMap **Nominatim** for geocoding (no key needed; polite `User-Agent`)

**Hosting**

- UI: Vercel
- Functions: Firebase

---

## Data model

**Collections**

- `events`
- `categories`
- `venues`
- `profiles`
- `orders`
- `meta` (document: `counters` → pretty order numbers)

**Events (selected fields)**

```
title: string
description: string
aboutHtml: string (plain HTML, no scripts)
image: string (URL)
startsAt: ISO string
endsAt: ISO string
capacity: number
ticketsSold: number
priceType: "free" | "payWhatYouWant" | "fixed"
price: number (for fixed)
currency: "GBP" | "EUR" | "USD" ...
publishStatus: "draft" | "published"
moderationStatus: "pending" | "approved" | "rejected"
categoryId, categoryName: string
venueId: string
organizerName, organizerWebsite: string
createdBy: uid
createdAt, updatedAt, submittedAt?: ISO string
approvedAt?, approvedHash?: string
ticketTypes: [] (reserved for future)
```

**Profiles**

```
firstName, lastName, username, role("member"|"staff"), avatar
about, address(null or object)
email, providerIds: string[]
acceptedPolicyAt, acceptedPolicyVersion
createdAt, updatedAt
```

**Categories**

```
name, name_lc, slug
createdAt, updatedAt
```

**Venues**

```
name, name_lc
address, city, country
lat, lng
createdAt, updatedAt
```

**Orders**

```
id (Stripe session id for paid; random for free)
orderCode ("000123")
eventId, userId
quantity, unitPrice, total, currency
priceType, status, paymentProvider, paymentStatus
createdAt
```

---

## Security (Firestore rules)

- **Profiles**

  - Read: self or staff
  - Create: self (doc id = uid)
  - Update: self (but **cannot** change `role` or `blocked`), or staff
  - Delete: self or staff

- **Venues / Categories**

  - Read: public
  - Create: any signed-in user
  - Update/Delete: staff only

- **Events**

  - Read: public can only read `published` **and** `approved`; creator & staff can read theirs/all.
  - Create: signed-in and `createdBy` must match `request.auth.uid`
  - Update: staff or owner; creators cannot change `createdBy`; moderation changes are staff-only.
  - Delete: staff, or owner if **not** published (server also checks orders).

- **Orders**

  - Read: staff, or owner of the order
  - Writes: **server only** (Cloud Functions with Admin SDK)

> Rules are in `/firebase.rules` (or wherever you keep them) and should be deployed with `firebase deploy --only firestore:rules`.

---

## Environments & configuration

### Frontend (`.env.local`)

Create a file at the repository root:

```bash
# Firebase web config (from Firebase console → Web App)
VITE_FB_API_KEY=...
VITE_FB_AUTH_DOMAIN=...
VITE_FB_PROJECT_ID=...
VITE_FB_STORAGE_BUCKET=...
VITE_FB_MSG_SENDER_ID=...
VITE_FB_APP_ID=...
VITE_FB_MEASUREMENT_ID=...

# Optional: local mock API (unused in production)
VITE_API_URL=http://localhost:5000

# Password policy (used by UI validation)
VITE_PASSWORD_REGEX=...

# Stripe publishable key (test)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Optional but recommended by Nominatim (used in User-Agent header)
VITE_OSM_EMAIL=you@example.com
```

### Cloud Functions (`functions/.env.*`)

You’ll have **two** env files for Functions (both are git-ignored):

- **Local emulators**
  `functions/.env.<YOUR_FIREBASE_PROJECT_ID>.local`
  Example (yours was `adventum-6f3a6.local`):

  ```bash
  STRIPE__SECRET=sk_test_...
  APP__ORIGIN=http://localhost:5173
  ```

- **Production / deployed**
  `functions/.env.<YOUR_FIREBASE_PROJECT_ID>` (no `.local`)

  ```bash
  STRIPE__SECRET=sk_test_...
  APP__ORIGIN=https://adventum-project.vercel.app
  ```

> The repo already ignores these files (`firebase.json` also ignores `*.local`).
> You can keep both files side-by-side. Use your actual project id in the filename.

### Why redirects work locally **and** on Vercel

In `functions/index.js` the server builds Stripe redirect URLs like this:

- It **first** tries to infer the origin from the incoming request headers:
  `Origin` / `Referer` / `X-Forwarded-Origin`.
  That means **local UI → local origin**, **Vercel UI → Vercel origin**.
- If headers are missing, it falls back to `APP__ORIGIN` (from `.env`), then to `http://localhost:5173`.

So as long as:

- your front-end calls the function from the same page the user is on, and
- the environment files above are set,

Stripe will send users back to the correct place:

```
<origin>/checkout/success?session_id=...
<origin>/checkout/cancel?event=...
```

---

## Local development

```bash
# 1) Install deps
npm i

# 2) Frontend env
cp .env.local.example .env.local   # if you keep an example file
# (fill values as described above)

# 3) (Optional) Start mock JSON server if you use it
npm run server

# 4) Start the UI
npm run dev   # http://localhost:5173

# 5) (Optional) Start Firebase emulators for functions
cd functions
npm i
firebase emulators:start --only functions
```

You can also develop the UI against **deployed** functions; just keep the Functions deployed and set the frontend’s Firebase config to that project.

---

## Deploy

### Deploy UI (Vercel)

1. Import the repo into Vercel.
2. **Environment Variables** (Project → Settings → Environment Variables): add everything from `.env.local` (all keys must be prefixed with `VITE_` exactly).
3. Framework preset: **Vite**
   Build command: `vite build`
   Output: `dist/`
4. Deploy.

Also add your Vercel domain (`adventum-project.vercel.app`) to **Firebase Auth → Authorized domains**.

### Deploy Cloud Functions

```bash
cd functions
npm i
# Ensure functions/.env.<projectId> (prod) exists with STRIPE__SECRET & APP__ORIGIN
firebase deploy --only functions
```

### Deploy Firestore rules

```bash
firebase deploy --only firestore:rules
```

---

## Seeding sample data

There is a Dev seeding screen (`/dev/seed`) that creates categories, venues and a variety of events (statuses, pricing, date ranges, capacities).
**Requirements:**

- You must be signed in.
- Your profile’s `role` must be **staff** (set in Firestore or via Staff UI).

> The seed only creates **categories/venues/events**. **Users and orders are not seeded**.

---

## User roles & permissions

- **member** (default):

  - Create, edit, delete **own** events (delete only if not published).
  - Publish own events (move to `pending` for moderation).
  - Cannot approve/reject moderation.

- **staff**:

  - Full access to events and users.
  - Approve/reject events, change user roles, block/unblock users.
  - Cascade delete helpers via Cloud Functions.

**Auth providers enabled:** Email/Password & Google.
**Password policy:** enforced in Firebase Auth (uppercase/lowercase/numeric/special) and validated on the UI.

**Sessions & consent**

- “Remember me” → localStorage; otherwise sessionStorage.
- Cookie banner writes a small consent record (`cookie-consent-v1`) to localStorage.
- On first Google sign-in we record privacy acceptance (`acceptedPolicy*`).

---

## Scripts

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "eslint .",
  "server": "json-server --watch data/db.json --port 5000 --delay 400"
}
```

---

**Questions?** Open an issue or reach out in the project discussion.
