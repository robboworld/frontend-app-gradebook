/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 */
import React from 'react';
import PropTypes from 'prop-types';

// Main nav tab icons, keyed by nav item `section` (as LMS header/nav_tab_icon.html).
// Same stroke as the lock of the locked «Личный кабинет» item; drawn by CSS, decorative only.
const SHAPES = {
  // Graduation cap
  dashboard: (
    <>
      <path d="M22 10 12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
      <path d="M22 10v5" />
    </>
  ),
  // Route between two points
  programs: (
    <>
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16" />
    </>
  ),
  // Grid of course cards
  catalog: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  // Briefcase
  lk: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </>
  ),
};

const RobboNavIcon = ({ section }) => {
  const shape = SHAPES[section];
  if (!shape) {
    return null;
  }
  return (
    <svg
      className="robbo-layout-header__nav-icon"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      aria-hidden="true"
      focusable="false"
    >
      {shape}
    </svg>
  );
};

RobboNavIcon.propTypes = {
  section: PropTypes.string.isRequired,
};

export default RobboNavIcon;
