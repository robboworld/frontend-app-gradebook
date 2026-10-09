// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
import React from 'react';

import { SearchField } from '@openedx/paragon';
import useSearchControlsData from './hooks';

/**
 * Controls for filtering the GradebookTable. Contains the "Edit Filters" button for opening the filter drawer
 * as well as the search box for searching by username/email.
 */
export const SearchControls = () => {
  const {
    onSubmit,
    onBlur,
    onClear,
    searchValue,
    inputLabel,
    hintText,
    screenReaderText,
  } = useSearchControlsData();

  return (
    <div className="search-container">
      <SearchField
        onSubmit={onSubmit}
        inputLabel={inputLabel}
        screenReaderText={screenReaderText}
        onBlur={onBlur}
        onClear={onClear}
        value={searchValue}
      />
      <small className="form-text text-muted search-help-text">
        {hintText}
      </small>
    </div>
  );
};

SearchControls.propTypes = {};

export default SearchControls;
