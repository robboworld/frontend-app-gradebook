/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * The one place every HTTP failure of an MFE passes: ``initialize({ authMiddleware: [robboErrorsMiddleware] })``
 * adds it to all of frontend-platform's axios clients, after its own processAxiosError (which writes
 * "Axios Error (Response): 500 - See custom attributes…" into error.message). Here error.message
 * becomes the human text with the code and number, so every screen that prints error.message shows
 * that instead; the technical details stay in error.customAttributes and error.robbo.technical.
 */
import {
  classify, infoForCode, inlineText, isCancellation,
} from './classify';
import { report } from './report';

/**
 * Classify ``error`` once, keep the result on it, give it the human message, journal it if needed.
 * ``options.startup``: see classify().
 */
export const describeError = (error, options = {}) => {
  const fresh = !(error && error.robbo);
  const info = classify(error, options);
  if (fresh && error && typeof error === 'object') {
    try {
      // eslint-disable-next-line no-param-reassign
      error.robbo = info;
      // eslint-disable-next-line no-param-reassign
      error.message = inlineText(info);
    } catch {
      // a frozen object: the page still gets ``info``
    }
  }
  report(info);
  return info;
};

/** An error the page detected itself, by its catalog ``code``; journaled like any other. */
export const describeCode = (code, details = {}) => {
  const info = infoForCode(code, details);
  report(info);
  return info;
};

export const robboErrorsMiddleware = (client) => {
  client.interceptors.response.use((response) => response, (error) => {
    if (!isCancellation(error)) {
      try {
        describeError(error);
      } catch {
        // error handling must never break the request's own error path
      }
    }
    return Promise.reject(error);
  });
};
