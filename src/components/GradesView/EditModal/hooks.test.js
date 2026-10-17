// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
import { useEffect } from 'react';

import { selectors, actions, thunkActions } from 'data/redux/hooks';
import { MockUseState } from 'testUtils';

import * as hooks from './hooks';

const { default: useEditModalData, modalTabs } = hooks;

jest.mock('data/redux/hooks', () => ({
  actions: {
    app: { useCloseModal: jest.fn() },
    grades: { useDoneViewingAssignment: jest.fn() },
  },
  selectors: {
    app: { useModalData: jest.fn() },
    assignmentTypes: { useAreGradesFrozen: jest.fn() },
    grades: { useGradeData: jest.fn() },
  },
  thunkActions: {
    grades: { useUpdateGrades: jest.fn() },
  },
}));

const state = new MockUseState(hooks);

const closeModal = jest.fn();
const doneViewingAssignment = jest.fn();
const updateGrades = jest.fn();
actions.app.useCloseModal.mockReturnValue(closeModal);
actions.grades.useDoneViewingAssignment.mockReturnValue(doneViewingAssignment);
thunkActions.grades.useUpdateGrades.mockReturnValue(updateGrades);

const gradeData = { gradeOverridHistoryError: 'test-error' };
const modalData = { open: true };
selectors.app.useModalData.mockReturnValue(modalData);
selectors.assignmentTypes.useAreGradesFrozen.mockReturnValue(false);
selectors.grades.useGradeData.mockReturnValue(gradeData);

let out;
describe('useEditModalData', () => {
  describe('state', () => {
    state.testGetter(state.keys.activeTab);
  });
  describe('hook', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      state.mock();
      out = useEditModalData();
    });
    afterEach(state.restore);
    describe('behavior', () => {
      it('initializes redux hooks', () => {
        expect(selectors.grades.useGradeData).toHaveBeenCalled();
        expect(selectors.app.useModalData).toHaveBeenCalled();
        expect(selectors.assignmentTypes.useAreGradesFrozen).toHaveBeenCalled();
        expect(actions.app.useCloseModal).toHaveBeenCalled();
        expect(actions.grades.useDoneViewingAssignment).toHaveBeenCalled();
        expect(thunkActions.grades.useUpdateGrades).toHaveBeenCalled();
      });
      it('starts on the answers tab', () => {
        state.expectInitializedWith(state.keys.activeTab, modalTabs.answers);
      });
      it('goes back to the answers tab on each opening', () => {
        expect(useEffect).toHaveBeenCalledWith(
          expect.any(Function),
          [modalData.open, state.setState[state.keys.activeTab]],
        );
        const [[effect]] = useEffect.mock.calls;
        effect();
        state.expectSetStateCalledWith(state.keys.activeTab, modalTabs.answers);
      });
      it('keeps the tab while the modal is closed', () => {
        jest.clearAllMocks();
        selectors.app.useModalData.mockReturnValueOnce({ open: false });
        useEditModalData();
        const [[effect]] = useEffect.mock.calls;
        effect();
        expect(state.setState[state.keys.activeTab]).not.toHaveBeenCalled();
      });
    });
    describe('output', () => {
      it('forwards error from gradeData.gradeOverrideHistoryError', () => {
        expect(out.error).toEqual(gradeData.gradeOverrideHistoryError);
      });
      it('forwards isOpen from modalData.open', () => {
        expect(out.isOpen).toEqual(modalData.open);
      });
      it('forwards areGradesFrozen from redux hook', () => {
        expect(out.areGradesFrozen).toEqual(false);
      });
      it('returns the active tab and its setter', () => {
        expect(out.activeTab).toEqual(modalTabs.answers);
        expect(out.setActiveTab).toEqual(state.setState[state.keys.activeTab]);
      });
      describe('handleAdjustedGradeClick', () => {
        it('updates grades, calls doneViewingAssignment and closeModal', () => {
          out.handleAdjustedGradeClick();
          expect(updateGrades).toHaveBeenCalled();
          expect(doneViewingAssignment).toHaveBeenCalled();
          expect(closeModal).toHaveBeenCalled();
        });
      });
      test('onClose calls doneViewingAssignment and closeModal', () => {
        out.onClose();
        expect(doneViewingAssignment).toHaveBeenCalled();
        expect(closeModal).toHaveBeenCalled();
        expect(updateGrades).not.toHaveBeenCalled();
      });
    });
  });
});
