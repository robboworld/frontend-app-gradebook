// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
import React from 'react';

import { Form } from '@openedx/paragon';

import useAdjustedGradeInputData from './hooks';

/**
 * <AdjustedGradeInput />
 * Input control for adjusting the grade of a unit
 * displays an "/ ${possibleGrade} if there is one in the data model.
 * Robbo: a short field with «/ N» beside it, not under it (robbo/GradebookTheme.scss).
 */
export const AdjustedGradeInput = () => {
  const {
    value,
    onChange,
    hintText,
  } = useAdjustedGradeInputData();
  return (
    <span className="robbo-adjusted-grade">
      <Form.Control
        className="robbo-adjusted-grade__input"
        type="text"
        inputMode="decimal"
        name="adjustedGradeValue"
        value={value}
        onChange={onChange}
      />
      {hintText}
    </span>
  );
};

AdjustedGradeInput.propTypes = {};

export default AdjustedGradeInput;
