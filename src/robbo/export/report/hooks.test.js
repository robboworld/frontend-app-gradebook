/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 */
import { MockUseState } from 'testUtils';
import { keyStore } from 'utils';
import useCourseName from 'robbo/useCourseName';

import { downloadFile } from '../data';
import { fetchLearners, fetchProgress } from './api';
import { buildReport, loadPdfTools } from './pdf';
import * as hooks from './hooks';

jest.mock('data/redux/hooks', () => ({
  selectors: { app: { useCourseId: jest.fn(() => 'course-v1:Org+Course+Run') } },
}));
jest.mock('robbo/useCourseName', () => jest.fn(() => 'Robots'));
jest.mock('../data', () => ({
  ...jest.requireActual('../data'),
  downloadFile: jest.fn(),
}));
jest.mock('./api', () => ({ fetchLearners: jest.fn(), fetchProgress: jest.fn() }));
jest.mock('./pdf', () => ({ buildReport: jest.fn(), loadPdfTools: jest.fn() }));

const state = new MockUseState(hooks);
const hookKeys = keyStore(hooks);
const flushPromises = () => new Promise(setImmediate);
const { statuses } = hooks;

const anna = {
  id: 1, username: 'anna', fullName: 'Анна Смирнова', email: 'anna@example.com', lastActivity: '2026-10-20T16:05:00Z',
};
const boris = {
  id: 2, username: 'boris', fullName: 'Борис Петров', email: 'boris@example.com', lastActivity: null,
};
const zoe = {
  id: 3, username: 'zoe', fullName: '', email: 'z@robots.ru', lastActivity: null,
};
const list = [anna, boris, zoe];

describe('report hooks', () => {
  describe('state', () => {
    ['isOpen', 'learners', 'selected', 'search', 'generation'].forEach((key) => state.testGetter(state.keys[key]));
  });

  describe('filterLearners', () => {
    test('by name, username or email, case-insensitive; empty search keeps all', () => {
      expect(hooks.filterLearners(list, '  ')).toEqual(list);
      expect(hooks.filterLearners(list, 'анна')).toEqual([anna]);
      expect(hooks.filterLearners(list, 'BOR')).toEqual([boris]);
      expect(hooks.filterLearners(list, 'robots.ru')).toEqual([zoe]);
    });
  });

  describe('collectReports', () => {
    test('progress one learner after another, with the activity of the list; PDF tools meanwhile', async () => {
      loadPdfTools.mockResolvedValue('tools');
      fetchProgress.mockImplementation((courseId, id) => Promise.resolve({ learner: { id }, sections: [] }));
      const onProgress = jest.fn();
      const result = await hooks.collectReports('course', [anna, boris], onProgress);
      expect(fetchProgress.mock.calls).toEqual([['course', 1], ['course', 2]]);
      expect(onProgress.mock.calls).toEqual([[1], [2]]);
      expect(result).toEqual({
        tools: 'tools',
        reports: [
          { learner: { id: 1 }, lastActivity: anna.lastActivity, progress: { learner: { id: 1 }, sections: [] } },
          { learner: { id: 2 }, lastActivity: null, progress: { learner: { id: 2 }, sections: [] } },
        ],
      });
    });
  });

  describe('useProgressReport', () => {
    let collectSpy;
    beforeEach(() => {
      jest.clearAllMocks();
      state.mock();
      collectSpy = jest.spyOn(hooks, hookKeys.collectReports);
    });
    afterEach(() => {
      state.restore();
      collectSpy.mockRestore();
    });
    const loaded = (selected = [], search = '', courseName = 'Робототехника') => {
      state.mockVal(state.keys.learners, { status: statuses.loaded, list, courseName });
      state.mockVal(state.keys.selected, selected);
      state.mockVal(state.keys.search, search);
    };

    test('closed, nothing loaded at first', () => {
      const out = hooks.useProgressReport();
      state.expectInitializedWith(state.keys.isOpen, false);
      state.expectInitializedWith(state.keys.selected, []);
      expect(out.isOpen).toEqual(false);
      expect(out.canGenerate).toEqual(false);
      expect(useCourseName).toHaveBeenCalledWith('course-v1:Org+Course+Run');
      expect(fetchLearners).not.toHaveBeenCalled();
    });
    // MockUseState replaces a state getter on setState: one render per test after a state change.
    test('opening loads the learners and the course name', async () => {
      fetchLearners.mockResolvedValue({ courseName: 'Робототехника', learners: list });
      hooks.useProgressReport().open();
      state.expectSetStateCalledWith(state.keys.isOpen, true);
      expect(fetchLearners).toHaveBeenCalledWith('course-v1:Org+Course+Run');
      await flushPromises();
      state.expectSetStateCalledWith(state.keys.learners, { status: statuses.loaded, list, courseName: 'Робототехника' });
    });
    test('opening again keeps the loaded learners', () => {
      loaded();
      hooks.useProgressReport().open();
      expect(fetchLearners).not.toHaveBeenCalled();
    });
    test('a failed load can be retried', async () => {
      fetchLearners.mockRejectedValue(new Error('500'));
      const out = hooks.useProgressReport();
      out.open();
      await flushPromises();
      state.expectSetStateCalledWith(state.keys.learners, { status: statuses.failed, list: [], courseName: null });
      out.retry();
      expect(fetchLearners).toHaveBeenCalledTimes(2);
    });
    test('search narrows the list; select all picks what is shown', () => {
      loaded([2], 'анна');
      const out = hooks.useProgressReport();
      expect(out.visible).toEqual([anna]);
      expect(out.allVisibleSelected).toEqual(false);
      out.toggleAll();
      const [[update]] = state.setState[state.keys.selected].mock.calls;
      expect(update([2])).toEqual([2, 1]);
    });
    test('select all again unpicks what is shown, keeps the rest', () => {
      loaded([2, 1], 'анна');
      const out = hooks.useProgressReport();
      expect(out.allVisibleSelected).toEqual(true);
      out.toggleAll();
      const [[update]] = state.setState[state.keys.selected].mock.calls;
      expect(update([2, 1])).toEqual([2]);
    });
    test('toggle one learner', () => {
      loaded([1]);
      const out = hooks.useProgressReport();
      expect(out.isSelected(1)).toEqual(true);
      expect(out.canGenerate).toEqual(true);
      out.toggle(2)();
      out.toggle(1)();
      const [[add], [remove]] = state.setState[state.keys.selected].mock.calls;
      expect(add([1])).toEqual([1, 2]);
      expect(remove([1])).toEqual([]);
    });
    test('search input', () => {
      hooks.useProgressReport().handleSearchChange({ target: { value: 'zoe' } });
      state.expectSetStateCalledWith(state.keys.search, 'zoe');
    });
    test('generate: picked learners, then the PDF file, then the window closes', async () => {
      loaded([3, 1]);
      collectSpy.mockImplementation((courseId, picked, onProgress) => {
        onProgress(1);
        return Promise.resolve({ tools: 'tools', reports: ['r1', 'r2'] });
      });
      const blob = new Blob(['%PDF']);
      buildReport.mockReturnValue({ output: jest.fn(() => blob) });
      hooks.useProgressReport().generate();
      // Picked learners in the order of the list (the PDF sorts them by name).
      expect(collectSpy.mock.calls[0][1]).toEqual([anna, zoe]);
      state.expectSetStateCalledWith(state.keys.generation, { status: statuses.loading, done: 0, total: 2 });
      expect(state.setState[state.keys.generation])
        .toHaveBeenCalledWith({ status: statuses.loading, done: 1, total: 2 });
      await flushPromises();
      // The course name from the LMS, not the header's and never the id.
      expect(buildReport).toHaveBeenCalledWith('tools', {
        reports: ['r1', 'r2'], courseName: 'Робототехника', formatMessage: expect.any(Function),
      });
      const [[content, fileName, type]] = downloadFile.mock.calls;
      expect(content).toBe(blob);
      expect(fileName).toMatch(/^Progress report – Робототехника – \d{4}-\d{2}-\d{2}\.pdf$/);
      expect(type).toEqual('application/pdf');
      state.expectSetStateCalledWith(state.keys.isOpen, false);
    });
    test('without a name from the LMS the header\'s name is used', async () => {
      loaded([1], '', null);
      collectSpy.mockResolvedValue({ tools: 'tools', reports: ['r1'] });
      buildReport.mockReturnValue({ output: jest.fn(() => new Blob(['%PDF'])) });
      hooks.useProgressReport().generate();
      await flushPromises();
      expect(buildReport.mock.calls[0][1].courseName).toEqual('Robots');
    });
    test('a failed report is announced, the window stays', async () => {
      loaded([1]);
      collectSpy.mockRejectedValue(new Error('500'));
      hooks.useProgressReport().generate();
      await flushPromises();
      state.expectSetStateCalledWith(state.keys.generation, { status: statuses.failed, done: 0, total: 0 });
      expect(state.setState[state.keys.isOpen]).not.toHaveBeenCalled();
      expect(downloadFile).not.toHaveBeenCalled();
    });
    test('the window does not close while the report is made', () => {
      state.mockVal(state.keys.generation, { status: statuses.loading, done: 0, total: 1 });
      const out = hooks.useProgressReport();
      expect(out.generating).toEqual(true);
      expect(out.canGenerate).toEqual(false);
      out.close();
      expect(state.setState[state.keys.isOpen]).not.toHaveBeenCalled();
    });
  });
});
