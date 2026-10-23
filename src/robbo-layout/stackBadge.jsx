/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { AppContext } from '@edx/frontend-platform/react';

// Robbo stack profile of this branch (online / skill / courses); each profile branch keeps its own value.
export const ROBBO_STACK_PROFILE = 'courses';

// Admin-only (`administrator` in JWT = global staff): profile letter O / S / C next to the logo.
const RobboStackBadge = ({ className }) => {
  const { authenticatedUser } = React.useContext(AppContext);
  if (!authenticatedUser?.administrator) {
    return null;
  }
  return (
    <span className={className} title={ROBBO_STACK_PROFILE}>
      {ROBBO_STACK_PROFILE.charAt(0).toUpperCase()}
    </span>
  );
};

RobboStackBadge.propTypes = {
  className: PropTypes.string.isRequired,
};

export default RobboStackBadge;
