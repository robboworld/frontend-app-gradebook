// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
import React from 'react';

import { useIntl } from '@edx/frontend-platform/i18n';
import { Button, Icon } from '@openedx/paragon';
import { ArrowBack } from '@openedx/paragon/icons';

import { instructorDashboardUrl } from 'data/services/lms/urls';
import useGradebookHeaderData from './hooks';
import messages from './messages';

/**
 * Robbo: the course name instead of its id (the id stays under it, in small print), an arrow
 * instead of «<<» and a compact header (robbo/GradebookTheme.scss).
 */
export const GradebookHeader = () => {
  const { formatMessage } = useIntl();
  const {
    areGradesFrozen,
    canUserViewGradebook,
    courseId,
    courseName,
    handleToggleViewClick,
    showBulkManagement,
    toggleViewMessage,
  } = useGradebookHeaderData();
  const dashboardUrl = instructorDashboardUrl();
  return (
    <div className="gradebook-header">
      <a href={dashboardUrl} className="robbo-gradebook-header__back">
        <Icon src={ArrowBack} size="sm" />
        {formatMessage(messages.backToDashboard)}
      </a>
      <h1 className="robbo-gradebook-header__title">{formatMessage(messages.gradebook)}</h1>
      <div className="subtitle-row robbo-gradebook-header__course">
        <div className="robbo-gradebook-header__course-name">
          <h2 className="text-break">{courseName || courseId}</h2>
          {courseName && <p className="robbo-gradebook-header__course-id text-break">{courseId}</p>}
        </div>
        {showBulkManagement && (
          <Button variant="tertiary" onClick={handleToggleViewClick}>
            {formatMessage(toggleViewMessage)}
          </Button>
        )}
      </div>
      {areGradesFrozen && (
        <div className="alert alert-warning" role="alert">
          {formatMessage(messages.frozenWarning)}
        </div>
      )}
      {(canUserViewGradebook === false) && (
        <div className="alert alert-warning" role="alert">
          {formatMessage(messages.unauthorizedWarning)}
        </div>
      )}
    </div>
  );
};

export default GradebookHeader;
