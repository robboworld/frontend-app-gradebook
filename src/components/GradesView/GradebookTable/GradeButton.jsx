// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
import React from 'react';
import PropTypes from 'prop-types';

import { Button } from '@openedx/paragon';

import { selectors, thunkActions } from 'data/redux/hooks';
import transforms from 'data/redux/transforms';
import * as module from './GradeButton';

export const useGradeButtonData = ({ entry, subsection }) => {
  const { gradeFormat } = selectors.grades.useGradeData();
  const setModalState = thunkActions.app.useSetModalStateFromTable();
  const label = transforms.grades.subsectionGrade({ gradeFormat, subsection })();

  const onClick = () => {
    setModalState({
      userEntry: entry,
      subsection,
    });
  };

  return {
    label,
    onClick,
  };
};

/**
 * GradeButton
 * The button link for a user's grade for a given subseciton.
 * load formatting based on selected grade format, and on click, opens
 * the editModal, loading in the current entry and subsection.
 * Robbo: frozen grades open it too: the modal then shows only the learner's answers.
 * @param {object} entry - user's grade entry
 * @param {object} subsection - user's subsection grade from subsection_breakdown
 */
export const GradeButton = ({ entry, subsection }) => {
  const { label, onClick } = module.useGradeButtonData({ entry, subsection });
  return (
    <Button
      variant="link"
      className="btn-header grade-button"
      onClick={onClick}
    >
      {label}
    </Button>
  );
};
GradeButton.propTypes = {
  subsection: PropTypes.shape({
    attempted: PropTypes.bool,
    percent: PropTypes.number,
    score_possible: PropTypes.number,
    subsection_name: PropTypes.string,
    module_id: PropTypes.string,
  }).isRequired,
  entry: PropTypes.shape({
    user_id: PropTypes.number,
    username: PropTypes.string,
  }).isRequired,
};

export default GradeButton;
