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

// Notifications button: one widget for every header, served by the LMS (robbo_notifications), like «Что нового»:
// bell with the unseen counter and a panel with the latest notifications; hides itself while the notifications
// tray is off. The full list is the Account MFE page /account/notifications.
const WIDGET_PATH = '/api/robbo/v1/notifications/widget.js';

let widgetPromise = null;

const loadNotificationsWidget = (lmsBaseUrl) => {
  if (window.RobboNotifications) {
    return Promise.resolve(window.RobboNotifications);
  }
  if (!widgetPromise) {
    widgetPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${lmsBaseUrl.replace(/\/$/, '')}${WIDGET_PATH}`;
      script.async = true;
      script.onload = () => (
        window.RobboNotifications ? resolve(window.RobboNotifications) : reject(new Error('no widget'))
      );
      script.onerror = () => {
        widgetPromise = null;
        reject(new Error('notifications widget failed to load'));
      };
      document.head.appendChild(script);
    });
  }
  return widgetPromise;
};

const getFeedUrl = (config) => {
  const base = config.ACCOUNT_SETTINGS_URL;
  return base ? `${base.replace(/\/$/, '')}/notifications` : undefined;
};

const RobboNotificationsBell = ({ className }) => {
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    const config = getConfig();
    const lmsBaseUrl = config.LMS_BASE_URL;
    let widget = null;
    let cancelled = false;
    if (!lmsBaseUrl) {
      return undefined;
    }
    loadNotificationsWidget(lmsBaseUrl)
      .then((api) => {
        if (!cancelled && containerRef.current) {
          widget = api.mount(containerRef.current, {
            lmsUrl: lmsBaseUrl, lang: getLocale(), variant: 'on-dark', feedUrl: getFeedUrl(config),
          });
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

RobboNotificationsBell.propTypes = {
  className: PropTypes.string,
};

RobboNotificationsBell.defaultProps = {
  className: undefined,
};

export default RobboNotificationsBell;
