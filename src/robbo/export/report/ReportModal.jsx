/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 *
 * Window of the PDF progress report: the learners of the course, most recently active first,
 * a search, «select all» for what the search shows, and «Генерация PDF».
 */
import React from 'react';
import PropTypes from 'prop-types';

import {
  ActionRow, Alert, Button, Form, ModalDialog, Spinner,
} from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';

import formatDateForDisplay from 'utils/formatDate';

import { statuses } from './hooks';
import messages from './messages';

export const LearnerOption = ({ learner, checked, onChange }) => {
  const { formatMessage } = useIntl();
  return (
    <li className="robbo-report__learner">
      <Form.Checkbox checked={checked} onChange={onChange} className="robbo-report__checkbox">
        <span className="robbo-report__label">
          <span className="robbo-report__name">{learner.fullName || learner.username}</span>
          <span className="robbo-report__meta">
            {[learner.fullName ? learner.username : null, learner.email].filter(Boolean).join(' · ')}
          </span>
        </span>
      </Form.Checkbox>
      <span className="robbo-report__activity">
        {learner.lastActivity
          ? formatMessage(messages.lastActivity, { date: formatDateForDisplay(new Date(learner.lastActivity)) })
          : formatMessage(messages.noActivity)}
      </span>
    </li>
  );
};

LearnerOption.propTypes = {
  learner: PropTypes.shape({
    id: PropTypes.number.isRequired,
    username: PropTypes.string.isRequired,
    fullName: PropTypes.string,
    email: PropTypes.string,
    lastActivity: PropTypes.string,
  }).isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
};

export const LearnerList = ({ report }) => {
  const { formatMessage } = useIntl();
  if (report.learnersStatus === statuses.failed) {
    return (
      <Alert
        variant="danger"
        actions={[<Button key="retry" variant="outline-danger" onClick={report.retry}>{formatMessage(messages.retry)}</Button>]}
      >
        {formatMessage(messages.loadError)}
      </Alert>
    );
  }
  if (report.learnersStatus !== statuses.loaded) {
    return (
      <div className="robbo-report__loading">
        <Spinner animation="border" variant="primary" screenReaderText={formatMessage(messages.loading)} />
      </div>
    );
  }
  return (
    <>
      <Form.Group className="robbo-report__search">
        <Form.Control
          type="search"
          value={report.search}
          onChange={report.handleSearchChange}
          placeholder={formatMessage(messages.search)}
          aria-label={formatMessage(messages.search)}
          disabled={report.generating}
        />
      </Form.Group>
      {report.visible.length === 0 ? (
        <p className="robbo-report__empty">{formatMessage(messages.noLearners)}</p>
      ) : (
        <>
          <Form.Checkbox
            className="robbo-report__select-all"
            checked={report.allVisibleSelected}
            onChange={report.toggleAll}
            disabled={report.generating}
          >
            {formatMessage(messages.selectAll, { count: report.visible.length })}
          </Form.Checkbox>
          <ul className="robbo-report__list" aria-label={formatMessage(messages.listLabel)}>
            {report.visible.map((learner) => (
              <LearnerOption
                key={learner.id}
                learner={learner}
                checked={report.isSelected(learner.id)}
                onChange={report.toggle(learner.id)}
              />
            ))}
          </ul>
        </>
      )}
    </>
  );
};

const reportShape = PropTypes.shape({
  isOpen: PropTypes.bool,
  close: PropTypes.func,
  learnersStatus: PropTypes.string,
  retry: PropTypes.func,
  visible: PropTypes.arrayOf(PropTypes.shape({})),
  search: PropTypes.string,
  handleSearchChange: PropTypes.func,
  selected: PropTypes.arrayOf(PropTypes.number),
  isSelected: PropTypes.func,
  toggle: PropTypes.func,
  allVisibleSelected: PropTypes.bool,
  toggleAll: PropTypes.func,
  generation: PropTypes.shape({ status: PropTypes.string, done: PropTypes.number, total: PropTypes.number }),
  generating: PropTypes.bool,
  canGenerate: PropTypes.bool,
  generate: PropTypes.func,
});

LearnerList.propTypes = { report: reportShape.isRequired };

export const ReportModal = ({ report }) => {
  const { formatMessage } = useIntl();
  const title = formatMessage(messages.modalTitle);
  return (
    <ModalDialog
      className="robbo-grade-modal robbo-report"
      title={title}
      isOpen={report.isOpen}
      onClose={report.close}
      size="lg"
      hasCloseButton={!report.generating}
      isFullscreenOnMobile
    >
      <ModalDialog.Header>
        <ModalDialog.Title>{title}</ModalDialog.Title>
      </ModalDialog.Header>
      <ModalDialog.Body>
        <p className="robbo-report__hint">{formatMessage(messages.hint)}</p>
        <LearnerList report={report} />
      </ModalDialog.Body>
      <ModalDialog.Footer>
        <div className="robbo-report__footer">
          <span className="robbo-report__status" role="status">
            {report.generating
              ? formatMessage(messages.generating, report.generation)
              : formatMessage(messages.selected, { count: report.selected.length })}
          </span>
          {report.generation.status === statuses.failed && (
            <span className="robbo-report__error" role="alert">{formatMessage(messages.generateError)}</span>
          )}
          <ActionRow>
            <Button variant="tertiary" onClick={report.close} disabled={report.generating}>
              {formatMessage(messages.cancel)}
            </Button>
            <Button variant="primary" onClick={report.generate} disabled={!report.canGenerate}>
              {formatMessage(messages.generate)}
            </Button>
          </ActionRow>
        </div>
      </ModalDialog.Footer>
    </ModalDialog>
  );
};

ReportModal.propTypes = { report: reportShape.isRequired };

export default ReportModal;
