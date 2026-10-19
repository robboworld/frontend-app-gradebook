/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 *
 * Which MFE this is and whom its errors send further by default: a learner to their teacher
 * (or support), course staff and authors to support. The server's answer, when it says, wins.
 */
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';

export const LEARNER = 'learner';
export const STAFF = 'staff';

const settings = { app: 'mfe', audience: LEARNER };

export const configure = ({ app, audience } = {}) => {
  if (app) {
    settings.app = app;
  }
  if (audience === LEARNER || audience === STAFF) {
    settings.audience = audience;
  }
};

export const appName = () => settings.app;

export const defaultAudience = () => {
  try {
    if (getAuthenticatedUser()?.administrator) {
      return STAFF;
    }
  } catch {
    // auth is not configured yet (APP_INIT_ERROR)
  }
  return settings.audience;
};
