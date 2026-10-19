/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * What an error means to the user (docs/human-errors.md §6 in the meta repo):
 * 1. an answer in the platform's error shape (error_code, user_title, user_message, incident_id) —
 *    from Django or from Caddy — is taken as is;
 * 2. any other answer is judged by its HTTP status;
 * 3. no answer at all means no connection (NET-OFFLINE);
 * 4. anything that is not an HTTP error is a crash of the page itself (APP-CRASH).
 * The number is the request's (X-Request-ID) or, without an answer, a new one.
 */
import { newIncidentId, normalizeId, shortId } from './ids';
import {
  appName, defaultAudience, LEARNER, STAFF,
} from './settings';
import {
  currentLanguage, describe, journalMode, uiText,
} from './texts';

const CODE = /^[A-Z]+(-[A-Z]+)+$/;
// While an MFE starts, it calls only the platform's own endpoints (runtime config, JWT refresh, the
// user's account). If one fails with such a status, the site is not working, the user typed nothing:
// e.g. with the LMS down the config does not load, and the JWT refresh then POSTs to the MFE's own
// static server (405). Shown as SRV-RESTART; the real status stays in the technical details.
const STARTUP_SITE_FAILURES = ['BAD-INPUT', 'NOT-FOUND', 'SRV-ERROR'];
const STATUS_CODES = {
  400: 'BAD-INPUT',
  401: 'SESSION-EXPIRED',
  403: 'ACCESS-DENIED',
  404: 'NOT-FOUND',
  413: 'UPLOAD-SIZE',
  429: 'TOO-MANY',
  502: 'SRV-RESTART',
  503: 'SRV-RESTART',
  504: 'SRV-RESTART',
};

export const codeForStatus = (status) => STATUS_CODES[status] || (status >= 500 ? 'SRV-ERROR' : 'BAD-INPUT');

/** An HTTP failure (with or without an answer), as opposed to a text or a crash of the page. */
export const isHttpError = (error) => Boolean(error) && Boolean(
  error.robbo?.url || error.response || error.request || error.isAxiosError || error.customAttributes?.httpErrorType,
);

export const isCancellation = (error) => Boolean(error) && (
  error.code === 'ERR_CANCELED' || error.name === 'CanceledError' || error.name === 'AbortError' || error.__CANCEL__ // eslint-disable-line no-underscore-dangle
);

const parseData = (data) => {
  if (typeof data !== 'string') {
    return data && typeof data === 'object' ? data : {};
  }
  try {
    const parsed = JSON.parse(data);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const withoutQuery = (url) => String(url || '').split(/[?#]/)[0];

const requestUrl = (error) => {
  const config = error.config || {};
  const url = config.url || error.customAttributes?.httpErrorRequestUrl || '';
  if (/^https?:\/\//.test(url) || !config.baseURL) {
    return withoutQuery(url);
  }
  return withoutQuery(`${config.baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`);
};

const header = (response, name) => {
  const headers = response?.headers;
  if (!headers) {
    return undefined;
  }
  return typeof headers.get === 'function' ? headers.get(name) : headers[name];
};

/**
 * ``{code, incidentId, shortId, status, title, message, audience, journal, serverJournaled, source,
 * url, method, technical}`` for any thrown value. Keeps the result on the error (``error.robbo``),
 * so the middleware, the page and the report all agree on one number. ``startup``: the error stopped
 * the MFE from starting (APP_INIT_ERROR).
 */
export const classify = (error, { startup = false } = {}) => {
  if (error && error.robbo) {
    return error.robbo;
  }
  const attributes = error?.customAttributes || {};
  const response = error?.response;
  const status = response?.status ?? attributes.httpErrorStatus ?? null;
  const isHttp = isHttpError(error);
  const body = parseData(response ? response.data : attributes.httpErrorResponseData);

  let code;
  let serverText = null;
  let serverJournaled = false;
  let fromCaddy = false;
  if (typeof body.error_code === 'string' && CODE.test(body.error_code)) {
    code = body.error_code;
    if (body.user_title && body.user_message) {
      serverText = { title: String(body.user_title), message: String(body.user_message) };
    }
    // Caddy's own answers (developer_message "caddy 502") never reached Django's journal.
    fromCaddy = String(body.developer_message || '').startsWith('caddy');
    serverJournaled = !fromCaddy;
  } else if (status) {
    code = codeForStatus(status);
    if (startup && STARTUP_SITE_FAILURES.includes(code)) {
      code = 'SRV-RESTART';
    }
  } else if (isHttp) {
    code = 'NET-OFFLINE';
  } else {
    code = 'APP-CRASH';
  }

  const incidentId = normalizeId(body.incident_id) || normalizeId(header(response, 'x-request-id')) || newIncidentId();
  const text = serverText || describe(code, currentLanguage());
  const audience = body.audience === LEARNER || body.audience === STAFF ? body.audience : defaultAudience();
  const technical = [startup && 'startup', status && `HTTP ${status}`, attributes.httpErrorType,
    attributes.httpErrorMessage, error?.message]
    .filter(Boolean).join(' · ').slice(0, 2000);

  return {
    code,
    incidentId,
    shortId: shortId(incidentId),
    status,
    title: text.title,
    message: text.message,
    audience,
    journal: journalMode(code),
    serverJournaled,
    fromCaddy,
    source: `mfe:${appName()}`,
    url: isHttp ? requestUrl(error) : '',
    method: String(error?.config?.method || attributes.httpErrorRequestMethod || '').toUpperCase(),
    technical: technical || String(error),
  };
};

/**
 * The same shape for an error the page detects itself (a unit that did not load in its iframe, a
 * file over the size limit): a catalog code, a new number, the URL it was about (without the
 * query), what happened, and ``params`` for the message (e.g. ``{ limit: 5 }``).
 */
export const infoForCode = (code, {
  url = '', status = null, technical = '', params = {},
} = {}) => {
  const incidentId = newIncidentId();
  const text = describe(code, currentLanguage(), params);
  return {
    code,
    incidentId,
    shortId: shortId(incidentId),
    status,
    title: text.title,
    message: text.message,
    audience: defaultAudience(),
    journal: journalMode(code),
    serverJournaled: false,
    fromCaddy: false,
    source: `mfe:${appName()}`,
    url: withoutQuery(url),
    method: '',
    technical: String(technical).slice(0, 2000),
  };
};

/** One line for places that print ``error.message``: title, message and the code with the number. */
export const inlineText = (info, lang = currentLanguage()) => {
  const label = uiText('code', lang).toLowerCase();
  const title = /[.!?]$/.test(info.title) ? info.title : `${info.title}.`;
  return `${title} ${info.message} (${label} ${info.code} · ${info.shortId})`;
};
