/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 */
import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  groupLabel: {
    id: 'robbo.gradebook.export.groupLabel',
    defaultMessage: 'Export the gradebook',
    description: 'Screen reader label of the export buttons above the gradebook table',
  },
  csv: {
    id: 'robbo.gradebook.export.csv',
    defaultMessage: 'Download CSV',
    description: 'Button: download the grades of all learners matching the filters as a CSV file (opens in Excel)',
  },
  pdf: {
    id: 'robbo.gradebook.export.pdf',
    defaultMessage: 'Progress report (PDF)',
    description: 'Button: open the window of the PDF progress report (learners to pick)',
  },
  preparing: {
    id: 'robbo.gradebook.export.preparing',
    defaultMessage: 'Preparing the file: {loaded} of {total} learners',
    description: 'Progress of the export while the grades of all pages load',
  },
  title: {
    id: 'robbo.gradebook.export.title',
    defaultMessage: 'Gradebook',
    description: 'Start of the CSV file name',
  },
  failed: {
    id: 'robbo.gradebook.export.failed',
    defaultMessage: 'Could not prepare the file. Try again.',
    description: 'The export failed (the grades did not load)',
  },
});

export default messages;
