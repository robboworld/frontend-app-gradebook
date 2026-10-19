/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 *
 * Inside AppProvider, around the routes: a crash while rendering shows the error page with a code
 * and number (APP-CRASH) instead of frontend-platform's English "An unexpected error occurred",
 * and goes to the journal with the component stack. AppProvider's own ErrorBoundary takes no
 * fallback, hence this one.
 */
import React from 'react';

import { logError } from '@edx/frontend-platform/logging';
import PropTypes from 'prop-types';

import { classify } from './classify';
import { report } from './report';
import RobboErrorPage from './RobboErrorPage';

class RobboErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { info: null };
  }

  static getDerivedStateFromError(error) {
    return { info: classify(error) };
  }

  componentDidCatch(error, errorInfo) {
    const { info } = this.state;
    if (info) {
      const stack = String(errorInfo?.componentStack || '').trim().slice(0, 1500);
      info.technical = [info.technical, stack].filter(Boolean).join('\n').slice(0, 2000);
      report(info);
    }
    try {
      logError(error, { robboIncident: info?.incidentId });
    } catch {
      // logging is not configured: nothing else to do
    }
  }

  render() {
    const { info } = this.state;
    const { children } = this.props;
    return info ? <RobboErrorPage info={info} /> : children;
  }
}

RobboErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default RobboErrorBoundary;
