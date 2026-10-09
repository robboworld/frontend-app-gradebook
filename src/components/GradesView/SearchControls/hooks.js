// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
import { useIntl } from '@edx/frontend-platform/i18n';

import { actions, selectors, thunkActions } from 'data/redux/hooks';

import robboMessages from 'robbo/messages';
import messages from './messages';

/**
 * Controls for filtering the GradebookTable. Contains the "Edit Filters" button for opening the filter drawer
 * as well as the search box for searching by username/email.
 */
export const useSearchControlsData = () => {
  const { formatMessage } = useIntl();
  const searchValue = selectors.app.useSearchValue();
  const fetchGrades = thunkActions.grades.useFetchGrades();
  const setSearchValue = actions.app.useSetSearchValue();

  const onBlur = (e) => {
    setSearchValue(e.target.value);
  };

  const onClear = () => {
    setSearchValue('');
    fetchGrades();
  };

  const onSubmit = (newValue) => {
    setSearchValue(newValue);
    fetchGrades();
  };

  return {
    onSubmit,
    onBlur,
    onClear,
    searchValue,
    inputLabel: formatMessage(messages.label),
    hintText: formatMessage(messages.hint),
    screenReaderText: {
      label: formatMessage(robboMessages.searchLabel),
      submitButton: formatMessage(robboMessages.searchSubmit),
      clearButton: formatMessage(robboMessages.searchClear),
    },
  };
};

export default useSearchControlsData;
