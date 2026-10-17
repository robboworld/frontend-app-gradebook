// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
/* eslint-disable import/no-self-import */
import React, { useEffect } from 'react';

import { StrictDict } from 'utils';
import { selectors, actions, thunkActions } from 'data/redux/hooks';
import * as module from './hooks';

// Robbo: tabs of the modal; each opening starts on the learner's answers.
export const modalTabs = StrictDict({
  answers: 'answers',
  override: 'override',
});

// useState behind an object, so that tests can mock it (testUtils MockUseState).
export const state = {
  activeTab: (val) => React.useState(val), // eslint-disable-line
};

export const useEditModalData = () => {
  const error = selectors.grades.useGradeData().gradeOverrideHistoryError;
  const isOpen = selectors.app.useModalData().open;
  const areGradesFrozen = selectors.assignmentTypes.useAreGradesFrozen();
  const closeModal = actions.app.useCloseModal();
  const doneViewingAssignment = actions.grades.useDoneViewingAssignment();
  const updateGrades = thunkActions.grades.useUpdateGrades();
  const [activeTab, setActiveTab] = module.state.activeTab(modalTabs.answers);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(modalTabs.answers);
    }
  }, [isOpen, setActiveTab]);

  const onClose = () => {
    doneViewingAssignment();
    closeModal();
  };

  const handleAdjustedGradeClick = () => {
    updateGrades();
    doneViewingAssignment();
    closeModal();
  };

  return {
    onClose,
    error,
    handleAdjustedGradeClick,
    isOpen,
    areGradesFrozen,
    activeTab,
    setActiveTab,
  };
};

export default useEditModalData;
