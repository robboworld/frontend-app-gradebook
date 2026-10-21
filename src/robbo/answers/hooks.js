/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 */
/* eslint-disable import/no-self-import */
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectors } from 'data/redux/hooks';

import { fetchLearnerAnswers } from './api';
import messages from './messages';
import * as module from './hooks';

export const loadStatuses = {
  loading: 'loading',
  loaded: 'loaded',
  failed: 'failed',
};

export const correctness = {
  correct: 'correct',
  incorrect: 'incorrect',
  partiallyCorrect: 'partially-correct',
};

// useState behind an object, so that tests can mock it (testUtils MockUseState).
export const state = {
  answers: (val) => React.useState(val), // eslint-disable-line
  attempt: (val) => React.useState(val), // eslint-disable-line
  onlyErrors: (val) => React.useState(val), // eslint-disable-line
  pictureExpanded: (val) => React.useState(val), // eslint-disable-line
  pictureFailed: (val) => React.useState(val), // eslint-disable-line
};

/** A wrong or partially wrong last submission. */
export const hasErrors = (problem) => (
  problem.correctness === correctness.incorrect || problem.correctness === correctness.partiallyCorrect
);

/** What the switch keeps: mistakes and open responses awaiting grading. */
export const needsAttention = (problem) => hasErrors(problem) || Boolean(problem.awaitingGrade);

/** Why the list is empty: no problems at all, nothing submitted or no mistakes. */
export const emptyMessage = (problems) => {
  if (!problems.length) {
    return messages.noProblems;
  }
  return problems.some((problem) => problem.correctness) ? messages.noErrors : messages.nothingSubmitted;
};

/** The learner and the subsection of the grade the edit modal was opened from. */
export const useModalSubject = () => ({
  courseId: selectors.app.useCourseId(),
  userId: useSelector(({ app }) => app.modalState.updateUserId),
  subsectionId: useSelector(({ app }) => app.modalState.updateModuleId),
});

/** Problems of the subsection with the learner's answers; `retry` reloads them after a failure. */
export const useLearnerAnswers = ({ courseId, userId, subsectionId }) => {
  const [answers, setAnswers] = module.state.answers({ status: loadStatuses.loading, problems: [] });
  const [attempt, setAttempt] = module.state.attempt(0);

  useEffect(() => {
    if (!userId || !subsectionId) {
      return undefined;
    }
    let isCurrent = true;
    setAnswers({ status: loadStatuses.loading, problems: [] });
    fetchLearnerAnswers(courseId, userId, subsectionId)
      .then((problems) => isCurrent && setAnswers({ status: loadStatuses.loaded, problems }))
      .catch(() => isCurrent && setAnswers({ status: loadStatuses.failed, problems: [] }));
    return () => { isCurrent = false; };
  }, [courseId, userId, subsectionId, attempt, setAnswers]);

  return { ...answers, retry: () => setAttempt((value) => value + 1) };
};

/**
 * Everything the «Ответы» tab shows; mistakes and open responses awaiting grading only until the
 * switch is turned off. When none or all of the problems are such, there is nothing to filter:
 * all problems, no switch.
 */
export const useLearnerAnswersData = () => {
  const subject = module.useModalSubject();
  const { status, problems, retry } = module.useLearnerAnswers(subject);
  const [onlyErrors, setOnlyErrors] = module.state.onlyErrors(true);
  const wrong = problems.filter(hasErrors);
  const attention = problems.filter(needsAttention);
  const canFilter = attention.length > 0 && attention.length < problems.length;

  return {
    courseId: subject.courseId,
    status,
    retry,
    problems,
    visibleProblems: canFilter && onlyErrors ? attention : problems,
    wrongCount: wrong.length,
    unansweredCount: problems.filter((problem) => !problem.correctness && !problem.awaitingGrade).length,
    awaitingCount: problems.filter((problem) => problem.awaitingGrade).length,
    canFilter,
    onlyErrors,
    handleOnlyErrorsChange: (event) => setOnlyErrors(event.target.checked),
    emptyMessage: module.emptyMessage(problems),
  };
};

/** A picture of an answer: small until clicked; a failed load (expired link) shows a note instead. */
export const usePicture = () => {
  const [expanded, setExpanded] = module.state.pictureExpanded(false);
  const [failed, setFailed] = module.state.pictureFailed(false);
  return {
    expanded,
    failed,
    toggle: () => setExpanded((value) => !value),
    handleError: () => setFailed(true),
  };
};
