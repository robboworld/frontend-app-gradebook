/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 *
 * The bottom of every error message (docs/human-errors.md §1): the code with the incident number,
 * a button that copies the whole line (support pastes it into the journal search as is), and whom
 * to turn to — a learner to their teacher or support, course staff and authors to support.
 */
import React, { useState } from 'react';

import PropTypes from 'prop-types';

import { STAFF } from './settings';
import {
  currentLanguage, splitLink, supportUrl, uiText,
} from './texts';
import './robbo-errors.scss';

const copyText = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Plain http (local stack): the Clipboard API is not available there.
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.className = 'robbo-errors-details__copy-field';
  document.body.appendChild(field);
  field.select();
  const done = document.execCommand('copy');
  field.remove();
  if (!done) {
    throw new Error('copy failed');
  }
};

/** @param {{ info: { code: string, shortId?: string, audience?: string } }} props */
const RobboErrorDetails = ({ info }) => {
  const lang = currentLanguage();
  const [copied, setCopied] = useState(false);
  const label = uiText('code', lang);
  const line = info.shortId ? `${info.code} · ${info.shortId}` : info.code;
  const [before, link, after] = splitLink(uiText(info.audience === STAFF ? 'help_staff' : 'help_learner', lang));

  const onCopy = () => {
    copyText(`${label}: ${line}`).then(() => setCopied(true)).catch(() => setCopied(false));
  };

  return (
    <div className="robbo-errors-details">
      <p className="robbo-errors-details__code">
        <span>
          {label}: <span className="robbo-errors-details__number">{line}</span>
        </span>
        <button type="button" className="btn btn-sm robbo-errors-details__copy" onClick={onCopy}>
          <span aria-live="polite">{uiText(copied ? 'copied' : 'copy', lang)}</span>
        </button>
      </p>
      <p className="robbo-errors-details__help">
        {before}
        <a href={supportUrl()} target="_blank" rel="noopener noreferrer">{link}</a>
        {after}
      </p>
    </div>
  );
};

RobboErrorDetails.propTypes = {
  info: PropTypes.shape({
    code: PropTypes.string.isRequired,
    shortId: PropTypes.string,
    audience: PropTypes.string,
  }).isRequired,
};

export default RobboErrorDetails;
