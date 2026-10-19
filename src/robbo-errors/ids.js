/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 *
 * Incident numbers: Caddy's request UUID (X-Request-ID, or incident_id of an error answer) as 32 hex
 * digits; the user sees the first 8 as 7F3A-29C1. Errors with no answer get a number made here.
 */
const REQUEST_ID = /^[0-9a-fA-F-]{8,64}$/;

export const normalizeId = (raw) => {
  const text = String(raw || '').trim();
  if (!REQUEST_ID.test(text)) {
    return '';
  }
  const digits = text.replace(/-/g, '').toLowerCase();
  return digits.length >= 8 ? digits.slice(0, 32) : '';
};

export const newIncidentId = () => {
  const cryptoApi = typeof window !== 'undefined' ? window.crypto : undefined;
  if (cryptoApi && cryptoApi.getRandomValues) {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  let digits = '';
  while (digits.length < 32) {
    digits += Math.floor(Math.random() * 16).toString(16);
  }
  return digits;
};

export const shortId = (incidentId) => {
  const head = String(incidentId || '').slice(0, 8).toUpperCase();
  return head.length === 8 ? `${head.slice(0, 4)}-${head.slice(4)}` : '';
};
