/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 *
 * Strings that upstream gradebook and Paragon hardcode in English.
 */
import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  allOption: {
    id: 'robbo.gradebook.filters.allOption',
    defaultMessage: 'All',
    description: 'First option of the assignment and assignment type filters',
  },
  removeFilter: {
    id: 'robbo.gradebook.FilterBadge.remove',
    defaultMessage: 'Remove filter',
    description: 'Screen reader label of the close button on a filter badge',
  },
  searchLabel: {
    id: 'robbo.gradebook.SearchField.label',
    defaultMessage: 'search',
    description: 'Screen reader label of the learner search field',
  },
  searchSubmit: {
    id: 'robbo.gradebook.SearchField.submit',
    defaultMessage: 'submit search',
    description: 'Screen reader label of the search button',
  },
  searchClear: {
    id: 'robbo.gradebook.SearchField.clear',
    defaultMessage: 'clear search',
    description: 'Screen reader label of the button that clears the search',
  },
});

export default messages;
