/* eslint-disable import/no-named-as-default */
// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
import React from 'react';
import PropTypes from 'prop-types';

import { badgeOrder } from 'data/constants/filters';

import FilterBadge from './FilterBadge';

/**
 * FilterBadges
 * Displays a FilterBadge for each filter type in the data model with their current values.
 * @param {func} handleClose - event taking a list of filternames to reset
 */
export const FilterBadges = ({ handleClose }) => (
  <div className="robbo-filter-badges">
    {badgeOrder.map(filterName => (
      <FilterBadge key={filterName} {...{ handleClose, filterName }} />
    ))}
  </div>
);
FilterBadges.propTypes = {
  handleClose: PropTypes.func.isRequired,
};

export default FilterBadges;
