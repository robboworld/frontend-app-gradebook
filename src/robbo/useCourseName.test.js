/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 */
import { useEffect } from 'react';

import { get } from 'data/services/lms/utils';
import { MockUseState } from 'testUtils';
import { keyStore } from 'utils';

import * as hooks from './useCourseName';

jest.mock('data/services/lms/utils', () => ({ get: jest.fn() }));

const state = new MockUseState(hooks);
const hookKeys = keyStore(hooks);
const courseId = 'course-v1:Org+Course+Run';

const flushPromises = () => new Promise(setImmediate);
const runEffect = async () => {
  const [effect] = useEffect.mock.calls[useEffect.mock.calls.length - 1];
  const cleanup = effect();
  await flushPromises();
  return cleanup;
};

describe('useCourseName', () => {
  describe('state', () => {
    state.testGetter(state.keys.courseName);
  });

  describe('fetchCourseName', () => {
    test('the name from the LMS courses API', async () => {
      get.mockResolvedValueOnce({ data: { name: 'Robots' } });
      await expect(hooks.fetchCourseName(courseId)).resolves.toEqual('Robots');
      expect(get).toHaveBeenCalledWith(`http://localhost:18000/api/courses/v1/courses/${courseId}/`);
    });
    test('null without a name', async () => {
      get.mockResolvedValueOnce({ data: {} });
      await expect(hooks.fetchCourseName(courseId)).resolves.toEqual(null);
    });
  });

  describe('hook', () => {
    let fetchSpy;
    beforeEach(() => {
      jest.clearAllMocks();
      state.mock();
      fetchSpy = jest.spyOn(hooks, hookKeys.fetchCourseName);
    });
    afterEach(() => {
      state.restore();
      fetchSpy.mockRestore();
    });

    test('null until the name loads', () => {
      fetchSpy.mockResolvedValue('Robots');
      expect(hooks.useCourseName(courseId)).toEqual(null);
      state.expectInitializedWith(state.keys.courseName, null);
      expect(useEffect.mock.calls[0][1]).toEqual([courseId, state.setState[state.keys.courseName]]);
    });
    test('loads the name of the course', async () => {
      fetchSpy.mockResolvedValue('Robots');
      hooks.useCourseName(courseId);
      await runEffect();
      expect(hooks.fetchCourseName).toHaveBeenCalledWith(courseId);
      state.expectSetStateCalledWith(state.keys.courseName, 'Robots');
    });
    test('keeps null when the name cannot be read', async () => {
      fetchSpy.mockRejectedValue(new Error('404'));
      hooks.useCourseName(courseId);
      await runEffect();
      expect(state.setState[state.keys.courseName]).not.toHaveBeenCalled();
    });
    test('ignores the answer for a replaced course', async () => {
      fetchSpy.mockResolvedValue('Robots');
      hooks.useCourseName(courseId);
      const [effect] = useEffect.mock.calls[0];
      effect()();
      await flushPromises();
      expect(state.setState[state.keys.courseName]).not.toHaveBeenCalled();
    });
    test('waits for the course id', () => {
      hooks.useCourseName('');
      const [effect] = useEffect.mock.calls[0];
      expect(effect()).toBeUndefined();
      expect(hooks.fetchCourseName).not.toHaveBeenCalled();
    });
  });
});
