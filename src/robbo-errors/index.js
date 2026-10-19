/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 *
 * Human-readable errors for the MFEs (docs/human-errors.md §6 in the meta repo). The source is
 * frontend/robbo-errors/ in the meta repo; scripts/robbo-errors-sync.py copies it into src/robbo-errors/
 * of every MFE together with catalog.json — edit the source, not a copy. In src/index.jsx:
 *
 *   initRobboErrors({ app: 'learning' });
 *   // PubSub calls back with (topic, data): the error is the second argument.
 *   subscribe(APP_INIT_ERROR, (message, error) => root.render(<RobboErrorPage error={error} startup />));
 *   <AppProvider><RobboErrorBoundary>…routes…</RobboErrorBoundary></AppProvider>
 *   initialize({ …, authMiddleware: [robboErrorsMiddleware] });
 */
import { APP_READY, subscribe } from '@edx/frontend-platform';

import { flushQueue, startReporting } from './report';
import { configure } from './settings';

export { classify, inlineText, isHttpError } from './classify';
export { describeCode, describeError, robboErrorsMiddleware } from './middleware';
export { default as RobboErrorBoundary } from './RobboErrorBoundary';
export { default as RobboErrorDetails } from './RobboErrorDetails';
export { default as RobboErrorNotice } from './RobboErrorNotice';
export { default as RobboErrorPage } from './RobboErrorPage';
export { LEARNER, STAFF } from './settings';
export { uiText } from './texts';

/** Name of the MFE (for the journal) and whom its errors send further by default. */
export const initRobboErrors = ({ app, audience } = {}) => {
  configure({ app, audience });
  startReporting();
  // Reports that waited offline: the LMS address is known once the runtime config is loaded.
  subscribe(APP_READY, flushQueue);
};
