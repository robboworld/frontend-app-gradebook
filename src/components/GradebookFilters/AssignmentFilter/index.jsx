/* eslint-disable react/sort-comp, react/button-has-type */
// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
import React from 'react';
import PropTypes from 'prop-types';

import { useIntl } from '@edx/frontend-platform/i18n';

import messages from '../messages';
import robboMessages from 'robbo/messages';
import SelectGroup from '../SelectGroup';
import useAssignmentFilterData from './hooks';

const AssignmentFilter = ({ updateQueryParams }) => {
  const {
    handleChange,
    selectedAssignmentLabel,
    assignmentFilterOptions,
  } = useAssignmentFilterData({ updateQueryParams });
  const { formatMessage } = useIntl();
  const filterOptions = assignmentFilterOptions.map(({ label, subsectionLabel }) => (
    <option key={label} value={label}>
      {label}: {subsectionLabel}
    </option>
  ));
  return (
    <div className="student-filters">
      <SelectGroup
        id="assignment"
        label={formatMessage(messages.assignment)}
        value={selectedAssignmentLabel}
        onChange={handleChange}
        disabled={assignmentFilterOptions.length === 0}
        options={[
          <option key="0" value="">{formatMessage(robboMessages.allOption)}</option>,
          ...filterOptions,
        ]}
      />
    </div>
  );
};

AssignmentFilter.propTypes = {
  updateQueryParams: PropTypes.func.isRequired,
};

export default AssignmentFilter;
