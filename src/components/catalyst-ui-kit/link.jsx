import * as Headless from '@headlessui/react';
import React, { forwardRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';

function isExternal(href) {
  return (
    /^https?:\/\//i.test(href) ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:')
  );
}

export const Link = forwardRef(function Link(
  { href, target, rel, ...props },
  ref
) {
  if (!href || isExternal(href) || target === '_blank') {
    return (
      <Headless.DataInteractive>
        <a
          href={href}
          target={target}
          rel={rel || (target === '_blank' ? 'noopener noreferrer' : undefined)}
          ref={ref}
          {...props}
        />
      </Headless.DataInteractive>
    );
  }

  return (
    <Headless.DataInteractive>
      <RouterLink to={href} ref={ref} {...props} />
    </Headless.DataInteractive>
  );
});
