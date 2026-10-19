/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 *
 * Texts of the error catalog (catalog.json is a generated copy of the platform's
 * lms/djangoapps/robbo_errors/catalog.yaml). Not react-intl: the error page must work before
 * i18n is set up (APP_INIT_ERROR) and outside the app's providers.
 */
import { getLocale } from '@edx/frontend-platform/i18n';

import catalog from './catalog.json';

const LANGUAGES = ['ru', 'en'];
// Site language when the user's one is neither: courses is English (online: 'ru').
const DEFAULT_LANGUAGE = 'en';
const FALLBACK_CODE = 'SRV-ERROR';
const PLACEHOLDER = /\{(\w+)\}/g;

// Set by the LMS on every page; the MFE reads the same cookie once i18n is configured.
const LANGUAGE_COOKIE = /(?:^|;\s*)openedx-language-preference=([^;]*)/;

const cookieLanguage = () => {
  const match = typeof document !== 'undefined' ? LANGUAGE_COOKIE.exec(document.cookie || '') : null;
  return match ? decodeURIComponent(match[1]) : '';
};

export const currentLanguage = () => {
  // The cookie first: when the runtime config did not load (the LMS is down), getLocale() does not
  // know the cookie's name and falls back to the browser's language. The page's lang is always "en".
  let locale = cookieLanguage();
  if (!locale) {
    try {
      locale = getLocale();
    } catch {
      locale = ''; // i18n is not configured yet
    }
  }
  const lang = String(locale || '').toLowerCase().split(/[-_]/)[0];
  return LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
};

export const isKnownCode = (code) => Object.prototype.hasOwnProperty.call(catalog.codes, code);

/** case: every occurrence goes to the journal; count: only a day counter on the server. */
export const journalMode = (code) => (isKnownCode(code) ? catalog.codes[code].journal : 'case');

export const uiText = (key, lang = currentLanguage()) => catalog.ui[key][lang];

export const supportUrl = () => catalog.ui.support_url;

/**
 * Title and message of ``code`` in ``lang``; ``params`` fill {placeholders}. A message whose
 * placeholders are not all known falls back to message_fallback. Unknown codes get the text of
 * SRV-ERROR (the code itself, shown next to it, still tells support what happened).
 */
export const describe = (code, lang = currentLanguage(), params = {}) => {
  const kind = catalog.codes[isKnownCode(code) ? code : FALLBACK_CODE];
  let complete = true;
  const message = kind.message[lang].replace(PLACEHOLDER, (match, name) => {
    if (params[name] === undefined || params[name] === null) {
      complete = false;
      return match;
    }
    return String(params[name]);
  });
  return {
    title: kind.title[lang],
    message: complete ? message : (kind.message_fallback || kind.message)[lang],
  };
};

/** "Show this message to your teacher or [contact support]" → [before, link text, after]. */
export const splitLink = (text) => {
  const match = /^(.*)\[(.+)\](.*)$/.exec(text);
  return match ? [match[1], match[2], match[3]] : [text, '', ''];
};
