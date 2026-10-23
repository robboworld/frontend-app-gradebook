/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 */
// Gradebook: same file as frontend-app-profile/src/robbo-layout (focusable locked hint).
/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from '@edx/frontend-platform/i18n';

// «Личный кабинет» before account activation: no link, a dimmed item with a lock and a hint
// (as LMS navbar-authenticated.html). The hint is a child, so screen readers read it with the name.
const RobboLkLockedItem = ({ messageId, variant }) => {
  const isMenu = variant === 'menu';
  return (
    <span
      className={isMenu
        ? 'robbo-layout-user-menu__item robbo-layout-user-menu__item--main-nav robbo-lk-locked robbo-lk-locked--menu'
        : 'robbo-layout-header__link robbo-lk-locked'}
      role={isMenu ? 'menuitem' : 'link'}
      aria-disabled="true"
      tabIndex={0}
    >
      <svg className="robbo-lk-locked__icon" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
      <FormattedMessage id={messageId} />
      <span className="robbo-lk-locked__hint">
        <FormattedMessage
          id="robbo.header.mainNav.personalAccountLockedHint"
          defaultMessage="Confirm your email to open your personal account"
        />
      </span>
    </span>
  );
};

RobboLkLockedItem.propTypes = {
  messageId: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['nav', 'menu']),
};

RobboLkLockedItem.defaultProps = {
  variant: 'nav',
};

export default RobboLkLockedItem;
