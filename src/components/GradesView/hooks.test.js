// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
import { useIntl } from '@edx/frontend-platform/i18n';

import { formatMessage } from 'testUtils';
import { actions, thunkActions } from 'data/redux/hooks';
import useHasMastersTrack from 'robbo/useHasMastersTrack';

import useGradesViewData from './hooks';
import messages from './messages';

jest.mock('data/redux/hooks', () => ({
  actions: {
    filters: { useResetFilters: jest.fn() },
  },
  thunkActions: {
    grades: { useFetchGrades: jest.fn() },
  },
}));

jest.mock('robbo/useHasMastersTrack', () => jest.fn());

const fetchGrades = jest.fn();
thunkActions.grades.useFetchGrades.mockReturnValue(fetchGrades);
const resetFilters = jest.fn();
actions.filters.useResetFilters.mockReturnValue(resetFilters);

useHasMastersTrack.mockReturnValue(true);

const updateQueryParams = jest.fn();

let out;
describe('useGradesViewData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    out = useGradesViewData({ updateQueryParams });
  });
  describe('behavior', () => {
    it('initializes intl hook', () => {
      expect(useIntl).toHaveBeenCalled();
    });
    it('initializes redux hooks', () => {
      expect(thunkActions.grades.useFetchGrades).toHaveBeenCalled();
      expect(actions.filters.useResetFilters).toHaveBeenCalled();
      expect(useHasMastersTrack).toHaveBeenCalled();
    });
  });
  describe('output', () => {
    test('stepHeadings', () => {
      expect(out.stepHeadings.filter).toEqual(formatMessage(messages.filterStepHeading));
      expect(out.stepHeadings.gradebook).toEqual(formatMessage(messages.gradebookStepHeading));
    });
    test('mastersHint', () => {
      expect(out.mastersHint).toEqual(formatMessage(messages.mastersHint));
    });
    // Robbo: the footnote explains the Student Key asterisk of master's track courses only.
    test('no mastersHint without a master\'s track', () => {
      useHasMastersTrack.mockReturnValueOnce(false);
      expect(useGradesViewData({ updateQueryParams }).mastersHint).toEqual(null);
    });
    describe('handleFilterBadgeClose', () => {
      it('resets filters locally and in query params, and fetches grades', () => {
        const filters = ['some', 'filter', 'names'];
        out.handleFilterBadgeClose(filters)();
        expect(resetFilters).toHaveBeenCalledWith(filters);
        expect(updateQueryParams).toHaveBeenCalledWith({
          some: false,
          filter: false,
          names: false,
        });
        expect(fetchGrades).toHaveBeenCalled();
      });
    });
  });
});
