/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 */
import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  modalTitle: {
    id: 'robbo.gradebook.report.modalTitle',
    defaultMessage: 'Progress report (PDF)',
    description: 'Title of the window where the learners of the PDF report are picked',
  },
  hint: {
    id: 'robbo.gradebook.report.hint',
    defaultMessage: 'Pick the learners. The list is sorted by the last activity in the course.',
    description: 'Explanation above the list of learners of the PDF report',
  },
  search: {
    id: 'robbo.gradebook.report.search',
    defaultMessage: 'Search by name, username or email',
    description: 'Label and placeholder of the field that filters the list of learners',
  },
  selectAll: {
    id: 'robbo.gradebook.report.selectAll',
    defaultMessage: 'Select all ({count})',
    description: 'Checkbox that picks all learners shown in the list (after the search)',
  },
  listLabel: {
    id: 'robbo.gradebook.report.listLabel',
    defaultMessage: 'Learners of the course',
    description: 'Screen reader label of the list of learners',
  },
  lastActivity: {
    id: 'robbo.gradebook.report.lastActivity',
    defaultMessage: 'Last activity: {date}',
    description: 'When the learner last did something in the course',
  },
  noActivity: {
    id: 'robbo.gradebook.report.noActivity',
    defaultMessage: 'No activity in the course',
    description: 'The learner has not opened or answered anything in the course',
  },
  loading: {
    id: 'robbo.gradebook.report.loading',
    defaultMessage: 'Loading the learners',
    description: 'Screen reader text of the spinner while the learners load',
  },
  loadError: {
    id: 'robbo.gradebook.report.loadError',
    defaultMessage: 'Could not load the learners.',
    description: 'The list of learners did not load',
  },
  retry: {
    id: 'robbo.gradebook.report.retry',
    defaultMessage: 'Try again',
    description: 'Button: load the learners again',
  },
  noLearners: {
    id: 'robbo.gradebook.report.noLearners',
    defaultMessage: 'No learners match the search.',
    description: 'The search left no learners in the list',
  },
  selected: {
    id: 'robbo.gradebook.report.selected',
    defaultMessage: 'Selected: {count}',
    description: 'How many learners are picked for the report',
  },
  cancel: {
    id: 'robbo.gradebook.report.cancel',
    defaultMessage: 'Cancel',
    description: 'Button: close the window without a report',
  },
  generate: {
    id: 'robbo.gradebook.report.generate',
    defaultMessage: 'Generate PDF',
    description: 'Button: make the PDF report of the picked learners',
  },
  generating: {
    id: 'robbo.gradebook.report.generating',
    defaultMessage: 'Preparing the report: {done} of {total} learners',
    description: 'Progress of the PDF report while the learners\' progress loads',
  },
  generateError: {
    id: 'robbo.gradebook.report.generateError',
    defaultMessage: 'Could not make the report. Try again.',
    description: 'The PDF report failed',
  },
  // The PDF
  fileTitle: {
    id: 'robbo.gradebook.report.fileTitle',
    defaultMessage: 'Progress report',
    description: 'Start of the PDF file name',
  },
  username: {
    id: 'robbo.gradebook.report.username',
    defaultMessage: 'Username: {username}',
    description: 'Username line of a learner in the PDF report',
  },
  email: {
    id: 'robbo.gradebook.report.email',
    defaultMessage: 'Email: {email}',
    description: 'Email line of a learner in the PDF report',
  },
  course: {
    id: 'robbo.gradebook.report.course',
    defaultMessage: 'Course: {name}',
    description: 'Course line of the PDF report',
  },
  summary: {
    id: 'robbo.gradebook.report.summary',
    defaultMessage: 'Course grade: {percent} %   ·   Units passed: {passed} of {total}',
    description: 'Summary of a learner in the PDF report',
  },
  columnSection: {
    id: 'robbo.gradebook.report.columnSection',
    defaultMessage: 'Section',
    description: 'Column of the PDF report: section of the course',
  },
  columnSubsection: {
    id: 'robbo.gradebook.report.columnSubsection',
    defaultMessage: 'Subsection',
    description: 'Column of the PDF report: subsection of the course',
  },
  columnUnit: {
    id: 'robbo.gradebook.report.columnUnit',
    defaultMessage: 'Unit',
    description: 'Column of the PDF report: unit with problems',
  },
  columnPoints: {
    id: 'robbo.gradebook.report.columnPoints',
    defaultMessage: 'Points',
    description: 'Column of the PDF report: points of the unit',
  },
  columnStatus: {
    id: 'robbo.gradebook.report.columnStatus',
    defaultMessage: 'Status',
    description: 'Column of the PDF report: passed or not',
  },
  points: {
    id: 'robbo.gradebook.report.points',
    defaultMessage: '{earned} of {possible}',
    description: 'Points of a unit or a subsection in the PDF report',
  },
  passed: {
    id: 'robbo.gradebook.report.passed',
    defaultMessage: 'Passed',
    description: 'Status of a unit with all of its points (100 %)',
  },
  notPassed: {
    id: 'robbo.gradebook.report.notPassed',
    defaultMessage: 'Not passed',
    description: 'Status of a unit with less than all of its points',
  },
  ungraded: {
    id: 'robbo.gradebook.report.ungraded',
    defaultMessage: '{name} (not graded)',
    description: 'Subsection whose points do not count in the course grade',
  },
  nothingScored: {
    id: 'robbo.gradebook.report.nothingScored',
    defaultMessage: 'The course has no units with points yet.',
    description: 'A learner report without any unit with points',
  },
  chartTitle: {
    id: 'robbo.gradebook.report.chartTitle',
    defaultMessage: 'Points by subsection',
    description: 'Title of the bar chart at the end of a learner report',
  },
  chartValue: {
    id: 'robbo.gradebook.report.chartValue',
    defaultMessage: '{earned} of {possible} · {percent} %',
    description: 'Value next to a bar of the chart',
  },
  page: {
    id: 'robbo.gradebook.report.page',
    defaultMessage: 'Page {page} of {pages}',
    description: 'Page number in the footer of the PDF report',
  },
});

export default messages;
