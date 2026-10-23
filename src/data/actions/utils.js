// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
import { createAction } from '@reduxjs/toolkit';

// Robbo: one date formatter for the app, in the interface language (utils/formatDate).
import formatDateForDisplay from 'utils/formatDate';

const sortAlphaAsc = (gradeRowA, gradeRowB) => {
  const a = gradeRowA.username.toUpperCase();
  const b = gradeRowB.username.toUpperCase();
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
};

const createActionFactory = (dataKey) => (actionKey, ...args) => (
  createAction(`${dataKey}/${actionKey}`, ...args)
);

export {
  createActionFactory,
  sortAlphaAsc,
  formatDateForDisplay,
};
