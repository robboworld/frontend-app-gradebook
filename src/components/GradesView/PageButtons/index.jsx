// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
import React from 'react';

import { Button } from '@openedx/paragon';

import usePageButtonsData from './hooks';

/** Robbo: hidden while all learners fit on one page; spacing in robbo/GradebookTheme.scss. */
export const PageButtons = () => {
  const { prev, next } = usePageButtonsData();

  if (prev.disabled && next.disabled) {
    return null;
  }
  return (
    <div className="robbo-page-buttons">
      <Button
        variant="outline-primary"
        disabled={prev.disabled}
        onClick={prev.onClick}
      >
        {prev.text}
      </Button>
      <Button
        variant="outline-primary"
        disabled={next.disabled}
        onClick={next.onClick}
      >
        {next.text}
      </Button>
    </div>
  );
};

PageButtons.propTypes = {};

export default PageButtons;
