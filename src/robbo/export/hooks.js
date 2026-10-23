/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 */
/* eslint-disable import/no-self-import */
import React from 'react';
import { useStore } from 'react-redux';
import { useIntl } from '@edx/frontend-platform/i18n';

import { selectors } from 'data/redux/hooks';
import useCourseName from 'robbo/useCourseName';

import * as data from './data';
import messages from './messages';
import * as module from './hooks';

export const exportStatuses = {
  idle: 'idle',
  loading: 'loading',
  failed: 'failed',
};

// useState behind an object, so that tests can mock it (testUtils MockUseState).
export const state = {
  status: (val) => React.useState(val), // eslint-disable-line
  progress: (val) => React.useState(val), // eslint-disable-line
};

/** The table of the export as a CSV file named after the gradebook and the course. */
export const deliverCsv = ({
  subject, courseName, grades, formatMessage,
}) => {
  const fileName = data.exportFileName(formatMessage(messages.title), courseName || subject.courseId);
  const columns = data.exportColumns(subject.headings, formatMessage);
  const rows = grades.map((entry) => data.exportRow(entry, subject.headings, subject.gradeFormat));
  data.downloadFile(data.toCsv(columns, rows), `${fileName}.csv`, 'text/csv;charset=utf-8');
};

/** CSV of the table: all learners of the current filters. */
export const useGradebookExport = () => {
  const { formatMessage } = useIntl();
  const store = useStore();
  const courseName = useCourseName(selectors.app.useCourseId());
  const { filteredUsersCount } = selectors.grades.useUserCounts();
  const [status, setStatus] = module.state.status(exportStatuses.idle);
  const [progress, setProgress] = module.state.progress({ loaded: 0, total: 0 });

  const exportCsv = () => {
    // The filters of the moment of the click, as the table shows them.
    const subject = data.exportSubject(store.getState());
    setStatus(exportStatuses.loading);
    setProgress({ loaded: 0, total: filteredUsersCount || 0 });
    // The LMS count can lag behind the rows it returns (a learner enrolled a moment ago).
    return data.fetchAllGrades(subject, (loaded, total) => setProgress({ loaded, total: Math.max(loaded, total) }))
      .then((grades) => {
        module.deliverCsv({
          subject, courseName, grades, formatMessage,
        });
        setStatus(exportStatuses.idle);
      })
      .catch(() => setStatus(exportStatuses.failed));
  };

  return {
    status,
    progress,
    disabled: status === exportStatuses.loading || !filteredUsersCount,
    exportCsv,
  };
};
