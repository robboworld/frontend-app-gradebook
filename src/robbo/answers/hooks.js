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
};

/** A wrong or partially wrong last submission. */
export const hasErrors = (problem) => (
  problem.correctness === correctness.incorrect || problem.correctness === correctness.partiallyCorrect
);

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

/** Everything the «Ответы» tab shows; problems with mistakes only until the switch is turned off. */
export const useLearnerAnswersData = () => {
  const subject = module.useModalSubject();
  const { status, problems, retry } = module.useLearnerAnswers(subject);
  const [onlyErrors, setOnlyErrors] = module.state.onlyErrors(true);
  const wrong = problems.filter(hasErrors);

  return {
    courseId: subject.courseId,
    status,
    retry,
    problems,
    visibleProblems: onlyErrors ? wrong : problems,
    wrongCount: wrong.length,
    unansweredCount: problems.filter((problem) => !problem.correctness).length,
    onlyErrors,
    handleOnlyErrorsChange: (event) => setOnlyErrors(event.target.checked),
    emptyMessage: module.emptyMessage(problems),
  };
};
