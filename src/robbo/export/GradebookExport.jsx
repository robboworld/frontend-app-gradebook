/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 *
 * Export buttons above the gradebook table: the table of every learner of the current filters
 * as CSV (data.js), and the PDF progress report of the learners picked in its window (report/).
 */
import React from 'react';

import { Button } from '@openedx/paragon';
import { Download, PictureAsPdf } from '@openedx/paragon/icons';
import { useIntl } from '@edx/frontend-platform/i18n';

import { exportStatuses, useGradebookExport } from './hooks';
import { useProgressReport } from './report/hooks';
import ReportModal from './report/ReportModal';
import messages from './messages';

export const GradebookExport = () => {
  const { formatMessage } = useIntl();
  const {
    status, progress, disabled, exportCsv,
  } = useGradebookExport();
  const report = useProgressReport();
  return (
    <div className="robbo-export" role="group" aria-label={formatMessage(messages.groupLabel)}>
      <Button variant="outline-primary" size="sm" iconBefore={Download} disabled={disabled} onClick={exportCsv}>
        {formatMessage(messages.csv)}
      </Button>
      <Button variant="outline-primary" size="sm" iconBefore={PictureAsPdf} onClick={report.open}>
        {formatMessage(messages.pdf)}
      </Button>
      {/* A live region of its own, so a screen reader tells when the file is ready or failed. */}
      <span className="robbo-export__status" role="status">
        {status === exportStatuses.loading && formatMessage(messages.preparing, progress)}
      </span>
      {status === exportStatuses.failed && (
        <span className="robbo-export__error" role="alert">{formatMessage(messages.failed)}</span>
      )}
      <ReportModal report={report} />
    </div>
  );
};

export default GradebookExport;
