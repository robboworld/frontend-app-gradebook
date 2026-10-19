/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 *
 * An error inside a page (a form that failed to save, a list that failed to load): Paragon's danger
 * Alert with the human title and message and RobboErrorDetails. Needs the app's IntlProvider (the
 * Alert's close button label), so use it inside AppProvider; whole-page errors use RobboErrorPage.
 * Pass the thrown ``error``, a catalog ``code`` (with ``details``: url, technical) for an error the
 * page detected itself, or ``info`` already made by describeError() (e.g. kept in a Redux store);
 * ``actions``: Paragon Alert buttons, e.g. «Обновить страницу».
 */
import React, { useMemo } from 'react';

import { Alert } from '@openedx/paragon';
import PropTypes from 'prop-types';

import { describeCode, describeError } from './middleware';
import RobboErrorDetails from './RobboErrorDetails';
import './robbo-errors.scss';

/**
 * @param {{ error?: any, code?: string | null, details?: object | null, info?: object | null, title?: string | null,
 *   onDismiss?: (() => void) | null, closeLabel?: string | null, className?: string | null,
 *   actions?: Array<any> | null }} props
 */
const RobboErrorNotice = ({
  error, code, details, info: given, title, onDismiss, closeLabel, className, actions,
}) => {
  const { url = '', technical = '' } = details || {};
  const info = useMemo(() => {
    if (given) {
      return given;
    }
    return code ? describeCode(code, { url, technical }) : describeError(error);
  }, [given, error, code, url, technical]);
  const closeProps = closeLabel ? { closeLabel } : {};
  const actionProps = actions ? { actions } : {};
  return (
    <Alert
      variant="danger"
      className={['robbo-errors-notice', className].filter(Boolean).join(' ')}
      dismissible={Boolean(onDismiss)}
      onClose={onDismiss}
      {...closeProps}
      {...actionProps}
    >
      <Alert.Heading>{title || info.title}</Alert.Heading>
      <p className="robbo-errors-notice__message">{info.message}</p>
      <RobboErrorDetails info={info} />
    </Alert>
  );
};

RobboErrorNotice.propTypes = {
  error: PropTypes.any, // eslint-disable-line react/forbid-prop-types
  code: PropTypes.string,
  details: PropTypes.shape({
    url: PropTypes.string,
    technical: PropTypes.string,
  }),
  actions: PropTypes.arrayOf(PropTypes.node),
  info: PropTypes.shape({
    code: PropTypes.string,
    title: PropTypes.string,
    message: PropTypes.string,
  }),
  title: PropTypes.string,
  onDismiss: PropTypes.func,
  closeLabel: PropTypes.string,
  className: PropTypes.string,
};

RobboErrorNotice.defaultProps = {
  error: null,
  code: null,
  details: null,
  actions: null,
  info: null,
  title: null,
  onDismiss: null,
  closeLabel: null,
  className: null,
};

export default RobboErrorNotice;
