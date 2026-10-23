// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
import React from 'react';
import PropTypes from 'prop-types';

import { Button } from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';

import { selectors } from 'data/redux/hooks';
import robboMessages from 'robbo/messages';

/**
 * FilterBadge
 * Base filter badge component, that displays a name and a close button.
 * If showValue is true, it will also display the included value.
 * Robbo: a light green chip with a small remove button (robbo/GradebookTheme.scss) instead of a
 * blue badge holding a full-size button; the chips sit in a row.
 * @param {func} handleClose - close/dismiss filter event, taking a list of filternames
 *   to reset when the filter badge closes.
 * @param {string} filterName - api filter name (for redux connector)
 */
export const FilterBadge = ({
  filterName,
  handleClose,
}) => {
  const { formatMessage } = useIntl();
  const {
    displayName,
    isDefault,
    hideValue,
    value,
    connectedFilters,
  } = selectors.root.useFilterBadgeConfig(filterName);
  if (isDefault) {
    return null;
  }
  return (
    <div className="robbo-filter-badge">
      <span className="robbo-filter-badge__text">
        <span data-testid="display-name">{formatMessage(displayName)}</span>
        <span data-testid="filter-value">
          {!hideValue ? `: ${value}` : ''}
        </span>
      </span>
      <Button
        variant="link"
        className="robbo-filter-badge__remove"
        aria-label={formatMessage(robboMessages.removeFilter)}
        onClick={handleClose(connectedFilters)}
      >
        <span aria-hidden="true">&times;</span>
      </Button>
    </div>
  );
};

FilterBadge.propTypes = {
  handleClose: PropTypes.func.isRequired,
  filterName: PropTypes.string.isRequired,
};

export default FilterBadge;
