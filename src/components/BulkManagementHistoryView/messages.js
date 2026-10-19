import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  heading: {
    id: 'gradebook.BulkManagementHistoryView.heading',
    defaultMessage: 'Bulk Management History',
    description: 'Heading text for BulkManagement History Tab',
  },
  helpText: {
    id: 'gradebook.BulkManagementHistoryView',
    defaultMessage: 'Below is a log of previous grade imports.  To download a CSV of your gradebook and import grades for override, return to the Gradebook.  Please note, after importing grades, it may take a few seconds to process the override.',
    description: 'Bulk Management History View help text',
  },
  bulkImportError: {
    id: 'gradebook.BulkManagementHistoryView.bulkImportError',
    defaultMessage: 'Errors while processing the file: {errors}',
    description: 'Robbo: errors of a CSV grade import, {errors} — the messages joined with semicolons',
  },
  successDialog: {
    id: 'gradebook.BulkManagementHistoryView.successDialog',
    defaultMessage: 'CSV processing. File uploads may take several minutes to complete.',
    description: 'Success Dialog message in BulkManagement Tab File Upload Form',
  },
});

export default messages;
