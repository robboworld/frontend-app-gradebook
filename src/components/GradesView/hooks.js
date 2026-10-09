// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
import { useIntl } from '@edx/frontend-platform/i18n';

import { actions, thunkActions } from 'data/redux/hooks';
import useHasMastersTrack from 'robbo/useHasMastersTrack';
import messages from './messages';

export const useGradesViewData = ({ updateQueryParams }) => {
  const { formatMessage } = useIntl();
  const fetchGrades = thunkActions.grades.useFetchGrades();
  const resetFilters = actions.filters.useResetFilters();
  const hasMastersTrack = useHasMastersTrack();

  const handleFilterBadgeClose = (filterNames) => () => {
    resetFilters(filterNames);
    updateQueryParams(filterNames.reduce(
      (obj, filterName) => ({ ...obj, [filterName]: false }),
      {},
    ));
    fetchGrades();
  };

  return {
    stepHeadings: {
      filter: formatMessage(messages.filterStepHeading),
      gradebook: formatMessage(messages.gradebookStepHeading),
    },
    handleFilterBadgeClose,
    // Robbo: the footnote explains the Student Key asterisk, shown only for master's track courses.
    mastersHint: hasMastersTrack ? formatMessage(messages.mastersHint) : null,
  };
};

export default useGradesViewData;
