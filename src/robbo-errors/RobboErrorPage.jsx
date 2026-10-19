/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 *
 * A whole-page error: an MFE that could not start (APP_INIT_ERROR) or crashed while rendering
 * (RobboErrorBoundary). Plain markup with Paragon/Bootstrap classes, no react-intl and no app
 * providers: it must render when nothing else is set up.
 */
import React, { useState } from 'react';

import { getConfig } from '@edx/frontend-platform';
import PropTypes from 'prop-types';

import { describeError } from './middleware';
import RobboErrorDetails from './RobboErrorDetails';
import { currentLanguage, uiText } from './texts';
import './robbo-errors.scss';

const lmsBaseUrl = () => {
  try {
    return getConfig().LMS_BASE_URL || null;
  } catch {
    return null;
  }
};

const mainAction = (code, lang) => {
  const lms = lmsBaseUrl();
  if (code === 'SESSION-EXPIRED' && lms) {
    return {
      label: uiText('login', lang),
      run: () => window.location.assign(`${lms}/login?next=${encodeURIComponent(window.location.href)}`),
    };
  }
  return { label: uiText('reload', lang), run: () => window.location.reload() };
};

/** @param {{ error?: any, info?: object | null, startup?: boolean }} props */
const RobboErrorPage = ({ error, info: given, startup }) => {
  const [info] = useState(() => given || describeError(error, { startup }));
  const lang = currentLanguage();
  const action = mainAction(info.code, lang);
  const home = lmsBaseUrl();

  return (
    <main className="robbo-errors-page" lang={lang}>
      <div className="robbo-errors-page__card">
        <h1 className="robbo-errors-page__title">{info.title}</h1>
        <p className="robbo-errors-page__message">{info.message}</p>
        <div className="robbo-errors-page__actions">
          <button type="button" className="btn robbo-errors-page__action" onClick={action.run}>{action.label}</button>
          {home && <a className="btn btn-link" href={home}>{uiText('home', lang)}</a>}
        </div>
        <RobboErrorDetails info={info} />
      </div>
    </main>
  );
};

RobboErrorPage.propTypes = {
  error: PropTypes.any, // eslint-disable-line react/forbid-prop-types
  info: PropTypes.shape({
    code: PropTypes.string,
    title: PropTypes.string,
    message: PropTypes.string,
  }),
  // The MFE could not start (APP_INIT_ERROR): its failed requests mean the site, not the user's data.
  startup: PropTypes.bool,
};

RobboErrorPage.defaultProps = {
  error: null,
  info: null,
  startup: false,
};

export default RobboErrorPage;
