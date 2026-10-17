/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 */
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectors } from 'data/redux/hooks';
import { MockUseState } from 'testUtils';
import { keyStore } from 'utils';

import { fetchLearnerAnswers } from './api';
import * as hooks from './hooks';
import messages from './messages';

const { correctness, loadStatuses } = hooks;

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('data/redux/hooks', () => ({
  selectors: { app: { useCourseId: jest.fn() } },
}));
jest.mock('./api', () => ({ fetchLearnerAnswers: jest.fn() }));

const state = new MockUseState(hooks);
const hookKeys = keyStore(hooks);

const subject = { courseId: 'course-v1:Org+Course+Run', userId: 42, subsectionId: 'hw1' };
const problems = [
  { id: 'wrong', correctness: correctness.incorrect },
  { id: 'right', correctness: correctness.correct },
  { id: 'partial', correctness: correctness.partiallyCorrect },
  { id: 'unanswered', correctness: null },
];

/** Wait until the pending promise callbacks have run. */
const flushPromises = () => new Promise(setImmediate);

/** Run the last registered effect and wait for its promise chain. */
const runEffect = async () => {
  const [effect] = useEffect.mock.calls[useEffect.mock.calls.length - 1];
  const cleanup = effect();
  await flushPromises();
  return cleanup;
};

describe('answers hooks', () => {
  describe('state', () => {
    state.testGetter(state.keys.answers);
    state.testGetter(state.keys.attempt);
    state.testGetter(state.keys.onlyErrors);
  });

  describe('hasErrors', () => {
    test('wrong and partially wrong submissions only', () => {
      expect(problems.filter(hooks.hasErrors).map(({ id }) => id)).toEqual(['wrong', 'partial']);
    });
  });

  describe('emptyMessage', () => {
    test('no problems', () => {
      expect(hooks.emptyMessage([])).toEqual(messages.noProblems);
    });
    test('nothing submitted', () => {
      expect(hooks.emptyMessage([problems[3]])).toEqual(messages.nothingSubmitted);
    });
    test('submitted without mistakes', () => {
      expect(hooks.emptyMessage([problems[1], problems[3]])).toEqual(messages.noErrors);
    });
  });

  describe('useModalSubject', () => {
    test('course from the app, learner and subsection from the modal state', () => {
      selectors.app.useCourseId.mockReturnValueOnce(subject.courseId);
      useSelector.mockImplementation((selector) => selector({
        app: { modalState: { updateUserId: subject.userId, updateModuleId: subject.subsectionId } },
      }));
      expect(hooks.useModalSubject()).toEqual(subject);
    });
  });

  describe('useLearnerAnswers', () => {
    let out;
    beforeEach(() => {
      jest.clearAllMocks();
      state.mock();
      out = hooks.useLearnerAnswers(subject);
    });
    afterEach(state.restore);

    test('starts loading', () => {
      state.expectInitializedWith(state.keys.answers, { status: loadStatuses.loading, problems: [] });
      state.expectInitializedWith(state.keys.attempt, 0);
      expect(out.status).toEqual(loadStatuses.loading);
      expect(out.problems).toEqual([]);
    });
    test('reloads when the learner, the subsection or the attempt changes', () => {
      expect(useEffect).toHaveBeenCalledWith(
        expect.any(Function),
        [subject.courseId, subject.userId, subject.subsectionId, 0, state.setState[state.keys.answers]],
      );
    });
    test('loads the problems', async () => {
      fetchLearnerAnswers.mockResolvedValueOnce(problems);
      await runEffect();
      expect(fetchLearnerAnswers).toHaveBeenCalledWith(subject.courseId, subject.userId, subject.subsectionId);
      state.expectSetStateCalledWith(state.keys.answers, { status: loadStatuses.loaded, problems });
    });
    test('reports a failure', async () => {
      fetchLearnerAnswers.mockRejectedValueOnce(new Error('network'));
      await runEffect();
      state.expectSetStateCalledWith(state.keys.answers, { status: loadStatuses.failed, problems: [] });
    });
    test('ignores the answer of a replaced request', async () => {
      let resolve;
      fetchLearnerAnswers.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
      const [effect] = useEffect.mock.calls[0];
      const cleanup = effect();
      cleanup();
      resolve(problems);
      await flushPromises();
      expect(state.setState[state.keys.answers]).not.toHaveBeenCalledWith(
        { status: loadStatuses.loaded, problems },
      );
    });
    test('waits for the modal subject', () => {
      jest.clearAllMocks();
      hooks.useLearnerAnswers({ ...subject, userId: null });
      const [effect] = useEffect.mock.calls[0];
      expect(effect()).toBeUndefined();
      expect(fetchLearnerAnswers).not.toHaveBeenCalled();
    });
    test('retry bumps the attempt', () => {
      out.retry();
      const [[update]] = state.setState[state.keys.attempt].mock.calls;
      expect(update(1)).toEqual(2);
    });
  });

  describe('useLearnerAnswersData', () => {
    const retry = jest.fn();
    let subjectSpy;
    let answersSpy;
    beforeEach(() => {
      jest.clearAllMocks();
      state.mock();
      subjectSpy = jest.spyOn(hooks, hookKeys.useModalSubject).mockReturnValue(subject);
      answersSpy = jest.spyOn(hooks, hookKeys.useLearnerAnswers)
        .mockReturnValue({ status: loadStatuses.loaded, problems, retry });
    });
    afterEach(() => {
      state.restore();
      subjectSpy.mockRestore();
      answersSpy.mockRestore();
    });

    test('loads the answers of the modal subject', () => {
      hooks.useLearnerAnswersData();
      expect(hooks.useLearnerAnswers).toHaveBeenCalledWith(subject);
    });
    test('problems with mistakes only by default', () => {
      const out = hooks.useLearnerAnswersData();
      state.expectInitializedWith(state.keys.onlyErrors, true);
      expect(out.visibleProblems.map(({ id }) => id)).toEqual(['wrong', 'partial']);
      expect(out.onlyErrors).toEqual(true);
    });
    test('all problems when the switch is off', () => {
      state.mockVal(state.keys.onlyErrors, false);
      expect(hooks.useLearnerAnswersData().visibleProblems).toEqual(problems);
    });
    test('counts and the rest of the data', () => {
      const out = hooks.useLearnerAnswersData();
      expect(out).toMatchObject({
        courseId: subject.courseId,
        status: loadStatuses.loaded,
        retry,
        problems,
        wrongCount: 2,
        unansweredCount: 1,
        emptyMessage: messages.noErrors,
      });
    });
    test('the switch sets the filter', () => {
      hooks.useLearnerAnswersData().handleOnlyErrorsChange({ target: { checked: false } });
      state.expectSetStateCalledWith(state.keys.onlyErrors, false);
    });
  });
});
