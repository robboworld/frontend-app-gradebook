/**
 * Copyright (C) 2024-2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';
import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

export const isRobboLkNavEnabled = (config) => Boolean(config?.ROBBO_LK_SSO_URL);

export const getRobboLkSsoUrl = (config) => (
  isRobboLkNavEnabled(config) ? config.ROBBO_LK_SSO_URL : null
);

export const getRobboLkHeaderNavItem = (config, { locked = false } = {}) => {
  const href = getRobboLkSsoUrl(config);
  if (!href) {
    return null;
  }
  return {
    href,
    messageId: 'robbo.header.mainNav.personalAccount',
    section: 'lk',
    locked,
  };
};

/** `email_verified` (= user.is_active in the LMS) from the JS-readable JWT header.payload cookie. */
const readJwtEmailVerified = (cookieName) => {
  try {
    const cookie = document.cookie.split('; ').find((item) => item.startsWith(`${cookieName}=`));
    const payload = cookie && cookie.slice(cookieName.length + 1).split('.')[1];
    if (!payload) {
      return undefined;
    }
    const claims = JSON.parse(window.atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof claims.email_verified === 'boolean' ? claims.email_verified : undefined;
  } catch (e) {
    return undefined;
  }
};

/**
 * Whether the signed-in user has activated the account: until then the LK item is locked.
 * Account / Profile hydrate `isActive`; elsewhere the JWT says so, and a "not active" JWT is checked
 * against the accounts API — the token is only refreshed hourly, activation should show at once.
 * Unknown → active, so the LK link is never locked by mistake.
 */
export const useRobboAccountActive = (authenticatedUser) => {
  const config = getConfig();
  const username = authenticatedUser?.username;
  const enabled = isRobboLkNavEnabled(config) && Boolean(username);
  const hydrated = typeof authenticatedUser?.isActive === 'boolean' ? authenticatedUser.isActive : undefined;
  const fromJwt = React.useMemo(
    () => (enabled && hydrated === undefined
      ? readJwtEmailVerified(config.ACCESS_TOKEN_COOKIE_NAME || 'edx-jwt-cookie-header-payload')
      : undefined),
    [enabled, hydrated, config.ACCESS_TOKEN_COOKIE_NAME],
  );
  const [fetched, setFetched] = React.useState(undefined);

  React.useEffect(() => {
    if (!enabled || hydrated !== undefined || fromJwt === true) {
      return undefined;
    }
    let cancelled = false;
    getAuthenticatedHttpClient()
      .get(`${config.LMS_BASE_URL}/api/user/v1/accounts/${encodeURIComponent(username)}`)
      .then(({ data }) => {
        if (!cancelled && typeof data?.is_active === 'boolean') {
          setFetched(data.is_active);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled, hydrated, fromJwt, username, config.LMS_BASE_URL]);

  return hydrated ?? fetched ?? fromJwt ?? true;
};
