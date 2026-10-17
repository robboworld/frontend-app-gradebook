/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 */
import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  modalTitle: {
    id: 'robbo.gradebook.EditModal.title',
    defaultMessage: 'Answers and grade',
    description: 'Title of the modal opened from a grade: the learner\'s answers and the grade form',
  },
  answersTitle: {
    id: 'robbo.gradebook.EditModal.answersTitle',
    defaultMessage: 'Learner\'s answers',
    description: 'Title of the modal opened from a grade when grades are frozen (answers only)',
  },
  answersTab: {
    id: 'robbo.gradebook.EditModal.answersTab',
    defaultMessage: 'Answers',
    description: 'Tab with the learner\'s answers to the problems of the assignment',
  },
  overrideTab: {
    id: 'robbo.gradebook.EditModal.overrideTab',
    defaultMessage: 'Change grade',
    description: 'Tab with the grade override form',
  },
  close: {
    id: 'robbo.gradebook.EditModal.close',
    defaultMessage: 'Close',
    description: 'Button that closes the modal on the answers tab',
  },
  loading: {
    id: 'robbo.gradebook.answers.loading',
    defaultMessage: 'Loading answers',
    description: 'Screen reader text of the spinner while the answers load',
  },
  loadError: {
    id: 'robbo.gradebook.answers.loadError',
    defaultMessage: 'Could not load the answers.',
    description: 'Error when the answers could not be loaded',
  },
  retry: {
    id: 'robbo.gradebook.answers.retry',
    defaultMessage: 'Try again',
    description: 'Button that loads the answers again after an error',
  },
  noProblems: {
    id: 'robbo.gradebook.answers.noProblems',
    defaultMessage: 'This assignment has no graded problems.',
    description: 'The assignment (subsection) has no scored problems for this learner',
  },
  nothingSubmitted: {
    id: 'robbo.gradebook.answers.nothingSubmitted',
    defaultMessage: 'The learner has not submitted any answers in this assignment yet.',
    description: 'Only problems with mistakes are shown and the learner submitted nothing',
  },
  noErrors: {
    id: 'robbo.gradebook.answers.noErrors',
    defaultMessage: 'No mistakes: all submitted answers are correct.',
    description: 'Only problems with mistakes are shown and there are none',
  },
  summary: {
    id: 'robbo.gradebook.answers.summary',
    defaultMessage: 'Problems with mistakes: {wrong} of {total}',
    description: 'How many problems of the assignment have wrong or partially wrong answers',
  },
  summaryUnanswered: {
    id: 'robbo.gradebook.answers.summaryUnanswered',
    defaultMessage: 'without an answer: {count}',
    description: 'Added to the summary: how many problems have no submitted answer',
  },
  onlyErrors: {
    id: 'robbo.gradebook.answers.onlyErrors',
    defaultMessage: 'Only problems with mistakes',
    description: 'Switch that hides correct and unanswered problems',
  },
  correct: {
    id: 'robbo.gradebook.answers.status.correct',
    defaultMessage: 'Correct',
    description: 'Status of a correctly answered problem or answer',
  },
  incorrect: {
    id: 'robbo.gradebook.answers.status.incorrect',
    defaultMessage: 'Incorrect',
    description: 'Status of a wrongly answered problem or answer',
  },
  partiallyCorrect: {
    id: 'robbo.gradebook.answers.status.partiallyCorrect',
    defaultMessage: 'Partially correct',
    description: 'Status of a partially correct problem or answer',
  },
  notSubmitted: {
    id: 'robbo.gradebook.answers.status.notSubmitted',
    defaultMessage: 'Not submitted',
    description: 'Status of a problem whose answer was saved but not submitted',
  },
  noAnswer: {
    id: 'robbo.gradebook.answers.status.noAnswer',
    defaultMessage: 'No answer',
    description: 'Status of a problem the learner did not answer',
  },
  points: {
    id: 'robbo.gradebook.answers.points',
    defaultMessage: 'Points: {earned} of {possible}',
    description: 'Points of the learner for the problem',
  },
  attempts: {
    id: 'robbo.gradebook.answers.attempts',
    defaultMessage: 'Attempts: {count}',
    description: 'How many times the learner submitted the problem',
  },
  learnerAnswer: {
    id: 'robbo.gradebook.answers.learnerAnswer',
    defaultMessage: 'Learner\'s answer',
    description: 'Label of the learner\'s answer to a question',
  },
  correctAnswer: {
    id: 'robbo.gradebook.answers.correctAnswer',
    defaultMessage: 'Correct answer',
    description: 'Label of the correct answer to a question',
  },
  emptyAnswer: {
    id: 'robbo.gradebook.answers.emptyAnswer',
    defaultMessage: 'no answer',
    description: 'Shown instead of the learner\'s answer to a question left empty',
  },
  savedNote: {
    id: 'robbo.gradebook.answers.savedNote',
    defaultMessage: 'The learner saved this answer but has not submitted it for checking.',
    description: 'Note on a problem with a saved, not submitted answer',
  },
  savedPointsNote: {
    id: 'robbo.gradebook.answers.savedPointsNote',
    defaultMessage: 'The points are for the previous submission.',
    description: 'Added to the saved answer note when the problem was submitted before',
  },
  notShownNote: {
    id: 'robbo.gradebook.answers.notShownNote',
    defaultMessage: 'Answers to this type of problem are not shown here: open it in the course.',
    description: 'Note on problems other than the standard ones (open response, drag and drop, SCORM)',
  },
  readError: {
    id: 'robbo.gradebook.answers.readError',
    defaultMessage: 'Could not read the answer to this problem.',
    description: 'The problem could not be read on the server',
  },
  openInCourse: {
    id: 'robbo.gradebook.answers.openInCourse',
    defaultMessage: 'Open in course',
    description: 'Link to the problem in the course',
  },
  opensInNewTab: {
    id: 'robbo.gradebook.answers.opensInNewTab',
    defaultMessage: 'opens in a new tab',
    description: 'Screen reader hint of the link to the problem',
  },
  listLabel: {
    id: 'robbo.gradebook.answers.listLabel',
    defaultMessage: 'Problems of the assignment',
    description: 'Screen reader label of the list of problems',
  },
});

export default messages;
