// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
import React from 'react';

import { useIntl } from '@edx/frontend-platform/i18n';

import { StrictDict } from 'utils';
import { selectors } from 'data/redux/hooks';

import robboMessages from 'robbo/messages';
import messages from './messages';
import HistoryHeader from './HistoryHeader';

export const HistoryKeys = StrictDict({
  assignment: 'assignment',
  student: 'student',
  originalGrade: 'original-grade',
  currentGrade: 'current-grade',
});

/**
 * <ModalHeaders />
 * Provides a list of HistoryHeaders for the student name, assignment,
 * original grade, and current override grade.
 * Robbo: grades as «2 из 7»; without an override the current grade says it was not changed
 * (upstream left it empty).
 */
export const ModalHeaders = () => {
  const { assignmentName, updateUserName } = selectors.app.useModalData();
  const {
    gradeOverrideCurrentEarnedGradedOverride,
    gradeOverrideCurrentPossibleGradedOverride,
    gradeOriginalEarnedGraded,
    gradeOriginalPossibleGraded,
  } = selectors.grades.useGradeData();
  const { formatMessage, formatNumber } = useIntl();
  const points = (earned, possible) => {
    if (earned === null || earned === undefined) {
      return null;
    }
    const number = (value) => formatNumber(value, { maximumFractionDigits: 2 });
    return possible
      ? formatMessage(robboMessages.gradePoints, { earned: number(earned), possible: number(possible) })
      : number(earned);
  };
  const originalGrade = points(gradeOriginalEarnedGraded, gradeOriginalPossibleGraded);
  const currentGrade = points(
    gradeOverrideCurrentEarnedGradedOverride,
    gradeOverrideCurrentPossibleGradedOverride ?? gradeOriginalPossibleGraded,
  ) ?? (originalGrade && formatMessage(robboMessages.gradeNotChanged));
  return (
    <div>
      <HistoryHeader
        id={HistoryKeys.assignment}
        label={formatMessage(messages.assignmentHeader)}
        value={assignmentName}
      />
      <HistoryHeader
        id={HistoryKeys.student}
        label={formatMessage(messages.studentHeader)}
        value={updateUserName}
      />
      <HistoryHeader
        id={HistoryKeys.originalGrade}
        label={formatMessage(messages.originalGradeHeader)}
        value={originalGrade}
      />
      <HistoryHeader
        id={HistoryKeys.currentGrade}
        label={formatMessage(messages.currentGradeHeader)}
        value={currentGrade}
      />
    </div>
  );
};

export default ModalHeaders;
