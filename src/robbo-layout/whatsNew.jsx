/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { getConfig } from '@edx/frontend-platform';
import { getLocale } from '@edx/frontend-platform/i18n';

// «Что нового» button: one widget for every header, served by the LMS (robbo_changelog); it fetches
// the user's changes on the LMS session and hides itself for guests.
const WIDGET_PATH = '/api/robbo/v1/whats-new/widget.js';

let widgetPromise = null;

export const loadWhatsNewWidget = (lmsBaseUrl) => {
  if (window.RobboWhatsNew) {
    return Promise.resolve(window.RobboWhatsNew);
  }
  if (!widgetPromise) {
    widgetPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${lmsBaseUrl.replace(/\/$/, '')}${WIDGET_PATH}`;
      script.async = true;
      script.onload = () => (window.RobboWhatsNew ? resolve(window.RobboWhatsNew) : reject(new Error('no widget')));
      script.onerror = () => {
        widgetPromise = null;
        reject(new Error('whats-new widget failed to load'));
      };
      document.head.appendChild(script);
    });
  }
  return widgetPromise;
};

const RobboWhatsNew = ({ className }) => {
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    const lmsBaseUrl = getConfig().LMS_BASE_URL;
    let widget = null;
    let cancelled = false;
    if (!lmsBaseUrl) {
      return undefined;
    }
    loadWhatsNewWidget(lmsBaseUrl)
      .then((api) => {
        if (!cancelled && containerRef.current) {
          widget = api.mount(containerRef.current, { lmsUrl: lmsBaseUrl, lang: getLocale(), variant: 'on-dark' });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (widget) {
        widget.unmount();
      }
    };
  }, []);

  return <span ref={containerRef} className={className} />;
};

RobboWhatsNew.propTypes = {
  className: PropTypes.string,
};

RobboWhatsNew.defaultProps = {
  className: undefined,
};

export default RobboWhatsNew;
