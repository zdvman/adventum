// src/pages/PrivacyPolicy.jsx
import { Fragment } from 'react';
import { Heading, Subheading } from '@/components/catalyst-ui-kit/heading';
import { Text, TextLink, Strong } from '@/components/catalyst-ui-kit/text';
import { Divider } from '@/components/catalyst-ui-kit/divider';
import {
  DescriptionList,
  DescriptionTerm,
  DescriptionDetails,
} from '@/components/catalyst-ui-kit/description-list';

// ── Update these to your details ───────────────────────────────────────────────
const COMPANY_NAME = 'Adventum';
const CONTROLLER_NAME = 'Adventum (Tech Returners pilot)'; // or your legal entity
const CONTACT_EMAIL = 'support@adventum.local'; // change this
const CONTACT_POSTAL = 'Your Company Address, City, Country'; // optional
const LAST_UPDATED = '09 Oct 2025';
// ───────────────────────────────────────────────────────────────────────────────

function Section({ id, title, children }) {
  return (
    <section id={id} className='scroll-mt-24'>
      <Subheading>{title}</Subheading>
      <div className='mt-4 space-y-4 text-zinc-300'>{children}</div>
      <Divider className='my-8' />
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className='mx-auto max-w-3xl px-6 py-10 lg:py-16'>
      <Heading>Privacy Policy</Heading>
      <div className='mt-2 text-sm text-zinc-400'>
        Last updated: {LAST_UPDATED}
      </div>
      <Divider className='my-6' />

      {/* Intro */}
      <div className='space-y-4 text-zinc-300'>
        <Text>
          This Privacy Policy explains how <Strong>{CONTROLLER_NAME}</Strong>{' '}
          (“we”, “us”, or “our”) collects, uses, shares, and safeguards your
          information when you use {COMPANY_NAME}, an events platform where
          staff publish events and community members sign up and (optionally)
          purchase tickets.
        </Text>
        <Text>
          This document is written to meet modern privacy expectations
          (including UK/EU GDPR and similar). It is not legal advice. If you
          have questions, contact us at{' '}
          <TextLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</TextLink>.
        </Text>
      </div>

      <Divider className='my-8' />

      {/* Quick facts */}
      <DescriptionList>
        <DescriptionTerm>Controller</DescriptionTerm>
        <DescriptionDetails>{CONTROLLER_NAME}</DescriptionDetails>
        <DescriptionTerm>Contact</DescriptionTerm>
        <DescriptionDetails>
          <TextLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</TextLink>
          {CONTACT_POSTAL ? (
            <Fragment>
              {' '}
              • <span className='text-zinc-400'>{CONTACT_POSTAL}</span>
            </Fragment>
          ) : null}
        </DescriptionDetails>
        <DescriptionTerm>Audience</DescriptionTerm>
        <DescriptionDetails>
          Staff users (event creators) and community members (attendees).
        </DescriptionDetails>
        <DescriptionTerm>Children</DescriptionTerm>
        <DescriptionDetails>
          {COMPANY_NAME} is not intended for children under 16. Do not use the
          service if you are under 16.
        </DescriptionDetails>
      </DescriptionList>

      <Divider className='my-8' />

      <Section id='data-we-collect' title='Data we collect'>
        <ul className='list-disc space-y-2 pl-6'>
          <li>
            <Strong>Account data</Strong>: name, email, username, avatar
            (optional), role (member/staff).
          </li>
          <li>
            <Strong>Event data</Strong>: event title, description, images, venue
            details, dates, capacity.
          </li>
          <li>
            <Strong>Purchase data</Strong>: quantity, amount, currency, and
            payment status. We do not store your full card details. Card
            processing is handled by Stripe.
          </li>
          <li>
            <Strong>Log/usage data</Strong>: device, browser, and basic
            interaction events (for security and troubleshooting).
          </li>
          <li>
            <Strong>Calendar data</Strong>: when you click “Add to Google
            Calendar,” we generate a link to your Google Calendar with event
            details; we do not gain ongoing access to your calendar.
          </li>
        </ul>
      </Section>

      <Section id='purposes' title='Why we use your data (purposes)'>
        <ul className='list-disc space-y-2 pl-6'>
          <li>
            Provide core features: authentication, event creation, bookings, and
            orders.
          </li>
          <li>Process payments for paid events via Stripe.</li>
          <li>
            Prevent fraud and abuse; ensure platform security and integrity.
          </li>
          <li>
            Send essential notifications (e.g., order confirmations, account
            emails).
          </li>
          <li>Comply with legal obligations and enforce our policies.</li>
        </ul>
      </Section>

      <Section id='legal-bases' title='Legal bases (UK/EU GDPR)'>
        <ul className='list-disc space-y-2 pl-6'>
          <li>
            <Strong>Contract</Strong>: to create your account, let you
            book/purchase events, and deliver the service.
          </li>
          <li>
            <Strong>Legitimate interests</Strong>: security, fraud prevention,
            service improvement (balanced against your rights).
          </li>
          <li>
            <Strong>Legal obligation</Strong>: tax and accounting records for
            orders/payments.
          </li>
          <li>
            <Strong>Consent</Strong>: optional features that clearly ask for it
            (e.g., cookie banner acknowledgements).
          </li>
        </ul>
      </Section>

      <Section id='cookies' title='Cookies & local storage'>
        <Text>
          We use essential cookies and local storage to keep you signed in,
          protect your account, and operate checkout. Analytics/advertising
          cookies are not used by default.
        </Text>
        <ul className='mt-2 list-disc space-y-2 pl-6'>
          <li>
            <Strong>Auth/session</Strong> (essential): keep you signed in,
            maintain session state.
          </li>
          <li>
            <Strong>Stripe</Strong> (essential for payments): Stripe may set its
            own cookies to complete payment securely.
          </li>
          <li>
            <Strong>Consent record</Strong> (local storage): we store your
            banner acknowledgement so we don’t nag you.
          </li>
        </ul>
        <Text className='mt-2'>
          You can control cookies in your browser settings. If you block
          essential cookies, some features may not work.
        </Text>
      </Section>

      <Section id='sharing' title='Sharing your data'>
        <Text>
          We share data only with service providers necessary to run{' '}
          {COMPANY_NAME}:
        </Text>
        <ul className='mt-2 list-disc space-y-2 pl-6'>
          <li>
            <Strong>Firebase</Strong> (Google) for authentication, database, and
            server functions.
          </li>
          <li>
            <Strong>Stripe</Strong> for secure payment processing.
          </li>
          <li>
            <Strong>Hosting</Strong> (e.g., Vercel or similar) for the web app.
          </li>
        </ul>
        <Text className='mt-2'>
          We require processors to protect your data and act only on our
          instructions. We do not sell your data.
        </Text>
      </Section>

      <Section id='transfers' title='International data transfers'>
        <Text>
          Our providers may process data in the UK, EU, and other countries.
          Where required, we rely on appropriate safeguards (e.g., Standard
          Contractual Clauses).
        </Text>
      </Section>

      <Section id='security' title='How we secure your data'>
        <ul className='list-disc space-y-2 pl-6'>
          <li>Industry-standard encryption in transit (HTTPS).</li>
          <li>Role-based access and server-side checks for staff actions.</li>
          <li>
            Limited data retention and the principle of data minimisation.
          </li>
        </ul>
      </Section>

      <Section id='retention' title='How long we keep data'>
        <Text>
          Account and event data is kept while your account is active.
          Order/payment records are retained for as long as required by tax and
          accounting laws. We delete or anonymise data when no longer needed.
        </Text>
      </Section>

      <Section id='your-rights' title='Your rights'>
        <Text>
          Subject to local law (e.g., UK/EU GDPR), you may have the right to
          access, rectify, erase, or port your data; restrict or object to
          processing; and withdraw consent where we rely on it. To exercise
          rights, contact{' '}
          <TextLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</TextLink>.
        </Text>
      </Section>

      <Section id='children' title='Children'>
        <Text>
          {COMPANY_NAME} is not intended for children under 16. If you believe
          we have collected data from a minor, contact us and we will take
          appropriate action.
        </Text>
      </Section>

      <Section id='changes' title='Changes to this policy'>
        <Text>
          We will update this page when our practices change. We may notify you
          by email or in-app for significant updates.
        </Text>
      </Section>

      <Section id='contact' title='Contact us'>
        <DescriptionList>
          <DescriptionTerm>Email</DescriptionTerm>
          <DescriptionDetails>
            <TextLink href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </TextLink>
          </DescriptionDetails>
          {CONTACT_POSTAL ? (
            <>
              <DescriptionTerm>Post</DescriptionTerm>
              <DescriptionDetails>{CONTACT_POSTAL}</DescriptionDetails>
            </>
          ) : null}
        </DescriptionList>
      </Section>
    </div>
  );
}
