/* eslint-disable react/sort-comp, react/button-has-type, import/no-named-as-default */
// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
import React from 'react';
import PropTypes from 'prop-types';

import GradebookExport from 'robbo/export/GradebookExport';

import BulkManagementControls from './BulkManagementControls';
import EditModal from './EditModal';
import FilterBadges from './FilterBadges';
import FilteredUsersLabel from './FilteredUsersLabel';
import FilterMenuToggle from './FilterMenuToggle';
import GradebookTable from './GradebookTable';
import GradesLoadError from './GradesLoadError';
import ImportSuccessToast from './ImportSuccessToast';
import InterventionsReport from './InterventionsReport';
import PageButtons from './PageButtons';
import ScoreViewInput from './ScoreViewInput';
import SearchControls from './SearchControls';
import SpinnerIcon from './SpinnerIcon';
import StatusAlerts from './StatusAlerts';

import useGradesViewData from './hooks';

export const GradesView = ({ updateQueryParams }) => {
  const {
    stepHeadings,
    handleFilterBadgeClose,
    mastersHint,
  } = useGradesViewData({ updateQueryParams });

  return (
    <>
      <SpinnerIcon />

      <InterventionsReport />
      <h3 className="step-message-1">
        {stepHeadings.filter}
      </h3>

      <div className="d-flex justify-content-between flex-wrap">
        <FilterMenuToggle />
        <SearchControls />
      </div>

      <FilterBadges handleClose={handleFilterBadgeClose} />
      <StatusAlerts />

      <h3>{stepHeadings.gradebook}</h3>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <ScoreViewInput />
        <BulkManagementControls />
      </div>

      {/* Robbo: export of the table (src/robbo/export) on the line of the learner count. */}
      <div className="robbo-table-toolbar">
        <div><FilteredUsersLabel /></div>
        <GradebookExport />
      </div>
      <GradesLoadError />

      <GradebookTable />

      <PageButtons />
      {mastersHint && <p>* {mastersHint}</p>}
      <EditModal />

      <ImportSuccessToast />
    </>
  );
};

GradesView.propTypes = {
  updateQueryParams: PropTypes.func.isRequired,
};

export default GradesView;
