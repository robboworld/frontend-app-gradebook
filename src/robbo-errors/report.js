/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Errors only the browser saw go to the platform's error journal (POST /api/robbo/v1/errors/report),
 * so that support finds the number the user sends them. Errors the server answered with its own
 * number are already journaled there. Codes with journal: count are reported only when Caddy
 * answered them (413 over the upload limit): Django never saw those, and the server keeps just a
 * day counter of them; other such errors (a 404 of an optional request) are not worth a report.
 *
 * fetch with keepalive (survives leaving the page), text/plain (no CORS preflight; the endpoint needs
 * no CSRF token), in CORS mode so that the status is known: a report the LMS did not take — offline,
 * or a 502 while it restarts, exactly when SRV-RESTART happens — waits in localStorage (up to
 * QUEUE_LIMIT) and is sent again a minute later, after the next APP_READY or when the browser is back
 * online. Requests that die because the user leaves the page are not errors and are not reported.
 */
import { getConfig } from '@edx/frontend-platform';

const REPORT_PATH = '/api/robbo/v1/errors/report';
const QUEUE_KEY = 'robbo-errors:queue';
const QUEUE_LIMIT = 20;
const REPORTS_PER_PAGE = 30; // a page failing in a loop must not flood the journal
const RETRY_DELAY_MS = 60 * 1000;
const RETRIES_PER_PAGE = 5;

let leaving = false;
let sent = 0;
let retries = 0;
let retryTimer = null;
// flushQueue, set below: a retry flushes the queue, and flushing may schedule a retry.
const retry = { flush: () => {} };

const reportUrl = () => {
  try {
    const base = getConfig().LMS_BASE_URL;
    return base ? `${base.replace(/\/$/, '')}${REPORT_PATH}` : null;
  } catch {
    return null;
  }
};

const readQueue = () => {
  try {
    const queue = JSON.parse(window.localStorage.getItem(QUEUE_KEY) || '[]');
    return Array.isArray(queue) ? queue : [];
  } catch {
    return [];
  }
};

const writeQueue = (queue) => {
  try {
    if (queue.length) {
      window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-QUEUE_LIMIT)));
    } else {
      window.localStorage.removeItem(QUEUE_KEY);
    }
  } catch {
    // storage is full or blocked: the report is lost, the page still works
  }
};

/** Resolves once the LMS took the report (2xx), rejects otherwise. */
const send = async (payload) => {
  const url = reportUrl();
  if (!url || typeof fetch === 'undefined' || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
    throw new Error('cannot report now');
  }
  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
    keepalive: true,
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`report answered ${response.status}`);
  }
};

const scheduleRetry = () => {
  if (retryTimer || retries >= RETRIES_PER_PAGE || typeof window === 'undefined') {
    return;
  }
  retries += 1;
  retryTimer = window.setTimeout(() => { retryTimer = null; retry.flush(); }, RETRY_DELAY_MS);
};

const keepForLater = (payload) => {
  writeQueue([...readQueue(), payload]);
  scheduleRetry();
};

export const flushQueue = () => {
  const queue = readQueue();
  if (!queue.length) {
    return;
  }
  writeQueue([]);
  queue.forEach((payload) => { send(payload).catch(() => keepForLater(payload)); });
};
retry.flush = flushQueue;

/** Journal ``info`` (see classify.js) unless the server already did, or the user is leaving. */
export const report = (info) => {
  const wanted = info.journal === 'case' || info.fromCaddy;
  if (info.reported || info.serverJournaled || !wanted || leaving || sent >= REPORTS_PER_PAGE) {
    return;
  }
  // eslint-disable-next-line no-param-reassign
  info.reported = true;
  sent += 1;
  const payload = {
    code: info.code,
    incident_id: info.incidentId,
    source: info.source,
    status: info.status,
    method: info.method,
    url: info.url,
    page: typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '',
    audience: info.audience,
    message: info.technical,
  };
  send(payload).catch(() => keepForLater(payload));
};

export const startReporting = () => {
  if (typeof window === 'undefined') {
    return;
  }
  const markLeaving = () => { leaving = true; };
  window.addEventListener('pagehide', markLeaving);
  window.addEventListener('beforeunload', markLeaving);
  window.addEventListener('pageshow', () => { leaving = false; });
  window.addEventListener('online', flushQueue);
};
