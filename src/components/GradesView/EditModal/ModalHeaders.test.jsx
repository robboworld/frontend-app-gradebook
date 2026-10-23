// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
import React from 'react';
import { shallow } from '@edx/react-unit-test-utils';

import { useIntl } from '@edx/frontend-platform/i18n';
import { selectors } from 'data/redux/hooks';

import { formatMessage } from 'testUtils';
import robboMessages from 'robbo/messages';

import HistoryHeader from './HistoryHeader';
import ModalHeaders, { HistoryKeys } from './ModalHeaders';
import messages from './messages';

jest.mock('./HistoryHeader', () => 'HistoryHeader');

jest.mock('data/redux/hooks', () => ({
  selectors: {
    app: { useModalData: jest.fn() },
    grades: { useGradeData: jest.fn() },
  },
}));

const modalData = {
  assignmentName: 'test-assignment-name',
  updateUserName: 'test-user-name',
};
selectors.app.useModalData.mockReturnValue(modalData);
const gradeData = {
  gradeOverrideCurrentEarnedGradedOverride: 'test-current-grade',
  gradeOriginalEarnedGraded: 'test-original-grade',
};
selectors.grades.useGradeData.mockReturnValue(gradeData);

let el;
describe('ModalHeaders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    el = shallow(<ModalHeaders />);
  });
  describe('behavior', () => {
    it('initializes intl', () => {
      expect(useIntl).toHaveBeenCalled();
    });
    it('initializes redux hooks', () => {
      expect(selectors.app.useModalData).toHaveBeenCalled();
      expect(selectors.grades.useGradeData).toHaveBeenCalled();
    });
  });
  describe('render', () => {
    test('snapshot', () => {
      expect(el.snapshot).toMatchSnapshot();
    });
    test('assignment header', () => {
      const headerProps = el.instance.findByType(HistoryHeader)[0].props;
      expect(headerProps).toMatchObject({
        id: HistoryKeys.assignment,
        label: formatMessage(messages.assignmentHeader),
        value: modalData.assignmentName,
      });
    });
    test('student header', () => {
      const headerProps = el.instance.findByType(HistoryHeader)[1].props;
      expect(headerProps).toMatchObject({
        id: HistoryKeys.student,
        label: formatMessage(messages.studentHeader),
        value: modalData.updateUserName,
      });
    });
    test('originalGrade header', () => {
      const headerProps = el.instance.findByType(HistoryHeader)[2].props;
      expect(headerProps).toMatchObject({
        id: HistoryKeys.originalGrade,
        label: formatMessage(messages.originalGradeHeader),
        value: gradeData.gradeOriginalEarnedGraded,
      });
    });
    test('currentGrade header', () => {
      const headerProps = el.instance.findByType(HistoryHeader)[3].props;
      expect(headerProps).toMatchObject({
        id: HistoryKeys.currentGrade,
        label: formatMessage(messages.currentGradeHeader),
        value: gradeData.gradeOverrideCurrentEarnedGradedOverride,
      });
    });
    // Robbo: points «2 из 7»; without an override the current grade is the original one.
    describe('grades in points', () => {
      const values = (data) => {
        selectors.grades.useGradeData.mockReturnValueOnce(data);
        return shallow(<ModalHeaders />).instance.findByType(HistoryHeader).slice(2)
          .map((header) => header.props.value);
      };
      test('original and changed grade out of the maximum', () => {
        expect(values({
          gradeOriginalEarnedGraded: 2,
          gradeOriginalPossibleGraded: 7,
          gradeOverrideCurrentEarnedGradedOverride: 5,
          gradeOverrideCurrentPossibleGradedOverride: 7,
        })).toEqual([
          formatMessage(robboMessages.gradePoints, { earned: '2', possible: '7' }),
          formatMessage(robboMessages.gradePoints, { earned: '5', possible: '7' }),
        ]);
      });
      test('not changed: the original grade counts', () => {
        expect(values({
          gradeOriginalEarnedGraded: 0,
          gradeOriginalPossibleGraded: 7,
          gradeOverrideCurrentEarnedGradedOverride: null,
        })).toEqual([
          formatMessage(robboMessages.gradePoints, { earned: '0', possible: '7' }),
          formatMessage(robboMessages.gradeNotChanged),
        ]);
      });
      test('nothing before the history loads', () => {
        expect(values({
          gradeOriginalEarnedGraded: null,
          gradeOverrideCurrentEarnedGradedOverride: null,
        })).toEqual([null, null]);
      });
    });
  });
});
