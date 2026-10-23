/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 */
import { useStore } from 'react-redux';

import { selectors } from 'data/redux/hooks';
import { MockUseState, formatMessage } from 'testUtils';
import { keyStore } from 'utils';
import useCourseName from 'robbo/useCourseName';

import * as data from './data';
import * as hooks from './hooks';

jest.mock('react-redux', () => ({ useStore: jest.fn() }));
jest.mock('data/redux/hooks', () => ({
  selectors: {
    app: { useCourseId: jest.fn(() => 'course-v1:Org+Course+Run') },
    grades: { useUserCounts: jest.fn(() => ({ filteredUsersCount: 2, totalUsersCount: 5 })) },
  },
}));
jest.mock('robbo/useCourseName', () => jest.fn(() => 'Robots'));
jest.mock('./data', () => ({
  ...jest.requireActual('./data'),
  exportSubject: jest.fn(),
  fetchAllGrades: jest.fn(),
  downloadFile: jest.fn(),
}));

const state = new MockUseState(hooks);
const hookKeys = keyStore(hooks);
const flushPromises = () => new Promise(setImmediate);

const subject = {
  courseId: 'course-v1:Org+Course+Run',
  headings: ['Username', 'Total Grade (%)'],
  gradeFormat: 'percent',
  searchText: null,
};
const grades = [{ username: 'ivan', percent: 0.5, section_breakdown: [] }];

describe('export hooks', () => {
  describe('state', () => {
    state.testGetter(state.keys.status);
    state.testGetter(state.keys.progress);
  });

  describe('deliverCsv', () => {
    beforeEach(() => jest.clearAllMocks());
    test('a file named after the gradebook and the course', () => {
      hooks.deliverCsv({
        subject, courseName: 'Robots', grades, formatMessage,
      });
      const [[content, fileName, type]] = data.downloadFile.mock.calls;
      expect(content).toEqual('\uFEFFUsername;Total Grade (%)\r\nivan;50\r\n');
      expect(fileName).toMatch(/^Gradebook – Robots – \d{4}-\d{2}-\d{2}\.csv$/);
      expect(type).toEqual('text/csv;charset=utf-8');
    });
    test('the course id without a name', () => {
      hooks.deliverCsv({
        subject, courseName: null, grades, formatMessage,
      });
      expect(data.downloadFile.mock.calls[0][1]).toMatch(/^Gradebook – course-v1 Org\+Course\+Run – /);
    });
  });

  describe('useGradebookExport', () => {
    const store = { getState: jest.fn(() => 'redux-state') };
    let deliverSpy;
    beforeEach(() => {
      jest.clearAllMocks();
      state.mock();
      useStore.mockReturnValue(store);
      data.exportSubject.mockReturnValue(subject);
      deliverSpy = jest.spyOn(hooks, hookKeys.deliverCsv).mockImplementation(() => {});
    });
    afterEach(() => {
      state.restore();
      deliverSpy.mockRestore();
    });

    test('idle at first, the course name of the header', () => {
      const out = hooks.useGradebookExport();
      state.expectInitializedWith(state.keys.status, hooks.exportStatuses.idle);
      expect(useCourseName).toHaveBeenCalledWith('course-v1:Org+Course+Run');
      expect(out.disabled).toEqual(false);
    });
    test('disabled while loading and without learners', () => {
      state.mockVal(state.keys.status, hooks.exportStatuses.loading);
      expect(hooks.useGradebookExport().disabled).toEqual(true);
      state.mockVal(state.keys.status, hooks.exportStatuses.idle);
      selectors.grades.useUserCounts.mockReturnValueOnce({ filteredUsersCount: 0, totalUsersCount: 5 });
      expect(hooks.useGradebookExport().disabled).toEqual(true);
    });
    test('loads every learner of the filters of the moment, then delivers', async () => {
      data.fetchAllGrades.mockImplementation((_, onProgress) => {
        onProgress(3, 2);
        return Promise.resolve(grades);
      });
      hooks.useGradebookExport().exportCsv();
      expect(data.exportSubject).toHaveBeenCalledWith('redux-state');
      state.expectSetStateCalledWith(state.keys.status, hooks.exportStatuses.loading);
      // The LMS count may lag behind the rows: never «3 of 2».
      expect(state.setState[state.keys.progress]).toHaveBeenCalledWith({ loaded: 3, total: 3 });
      await flushPromises();
      expect(hooks.deliverCsv).toHaveBeenCalledWith({
        subject, courseName: 'Robots', grades, formatMessage: expect.any(Function),
      });
      state.expectSetStateCalledWith(state.keys.status, hooks.exportStatuses.idle);
    });
    test('a failure is reported', async () => {
      data.fetchAllGrades.mockRejectedValue(new Error('500'));
      hooks.useGradebookExport().exportCsv();
      await flushPromises();
      expect(hooks.deliverCsv).not.toHaveBeenCalled();
      state.expectSetStateCalledWith(state.keys.status, hooks.exportStatuses.failed);
    });
  });
});
