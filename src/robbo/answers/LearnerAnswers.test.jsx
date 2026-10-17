/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 */
import React from 'react';
import { shallow } from '@edx/react-unit-test-utils';

import {
  Alert, Badge, Form, Hyperlink, Icon, Spinner,
} from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';

import { formatMessage } from 'testUtils';

import { correctness, loadStatuses, useLearnerAnswersData } from './hooks';
import LearnerAnswers, { Answer, ProblemAnswers, StatusBadge } from './LearnerAnswers';
import messages from './messages';

jest.mock('./hooks', () => ({
  ...jest.requireActual('./hooks'),
  useLearnerAnswersData: jest.fn(),
}));

useIntl.mockReturnValue({ formatMessage, formatNumber: (value) => `${value}` });

const courseId = 'course-v1:Org+Course+Run';
const wrongAnswer = {
  question: 'How many wheels?', answer: 'Two', correctAnswer: 'Four', correctness: correctness.incorrect,
};
const rightAnswer = {
  question: 'What turns a wheel?', answer: 'Motor', correctAnswer: 'Motor', correctness: correctness.correct,
};
const problem = {
  id: 'block-v1:Org+Course+Run+type@problem+block@mc',
  type: 'problem',
  name: 'Wheels',
  unitName: 'Unit 1',
  earned: 0.5,
  possible: 2,
  attempts: 3,
  saved: false,
  correctness: correctness.partiallyCorrect,
  answers: [rightAnswer, wrongAnswer],
  answersError: false,
};
const data = {
  courseId,
  status: loadStatuses.loaded,
  retry: jest.fn().mockName('hooks.retry'),
  problems: [problem, { ...problem, id: 'right', correctness: correctness.correct }, { ...problem, id: 'none' }],
  visibleProblems: [problem],
  wrongCount: 1,
  unansweredCount: 1,
  onlyErrors: true,
  handleOnlyErrorsChange: jest.fn().mockName('hooks.handleOnlyErrorsChange'),
  emptyMessage: messages.noErrors,
};

let el;
const render = (props = {}) => {
  useLearnerAnswersData.mockReturnValue({ ...data, ...props });
  el = shallow(<LearnerAnswers />);
};
const textOf = (element) => element.children.map((child) => child.el).join('');

describe('LearnerAnswers', () => {
  describe('loading', () => {
    test('spinner', () => {
      render({ status: loadStatuses.loading, problems: [], visibleProblems: [] });
      expect(el.instance.type).toEqual('div');
      const [spinner] = el.instance.findByType(Spinner);
      expect(spinner.props.screenReaderText).toEqual(formatMessage(messages.loading));
    });
  });

  describe('failed', () => {
    test('error with a retry button', () => {
      render({ status: loadStatuses.failed, problems: [], visibleProblems: [] });
      expect(el.instance.type).toEqual(Alert);
      expect(el.instance.children[0].el).toEqual(formatMessage(messages.loadError));
      const [retryButton] = el.instance.props.actions;
      expect(retryButton.props.onClick).toEqual(data.retry);
    });
  });

  describe('loaded', () => {
    beforeEach(() => render());
    test('snapshot', () => {
      expect(el.snapshot).toMatchSnapshot();
    });
    test('summary with mistakes and unanswered problems', () => {
      const [summary] = el.instance.findByType('p');
      expect(textOf(summary)).toEqual(
        `${formatMessage(messages.summary, { wrong: 1, total: 3 })}, `
        + `${formatMessage(messages.summaryUnanswered, { count: 1 })}`,
      );
    });
    test('summary without unanswered problems', () => {
      render({ unansweredCount: 0 });
      const [summary] = el.instance.findByType('p');
      expect(textOf(summary)).toEqual(formatMessage(messages.summary, { wrong: 1, total: 3 }));
    });
    test('switch of the filter', () => {
      const [toggle] = el.instance.findByType(Form.Switch);
      expect(toggle.props.checked).toEqual(true);
      expect(toggle.props.onChange).toEqual(data.handleOnlyErrorsChange);
      expect(toggle.children[0].el).toEqual(formatMessage(messages.onlyErrors));
    });
    test('visible problems', () => {
      const items = el.instance.findByType(ProblemAnswers);
      expect(items.length).toEqual(1);
      expect(items[0].props).toEqual({
        key: problem.id, courseId, problem, headingId: 'robbo-answers-problem-0',
      });
    });
    test('empty message when nothing is visible', () => {
      render({ visibleProblems: [] });
      expect(el.instance.findByType(ProblemAnswers)).toEqual([]);
      const empty = el.instance.findByType('p')[1];
      expect(empty.children[0].el).toEqual(formatMessage(messages.noErrors));
    });
    test('no toolbar without problems', () => {
      render({
        problems: [], visibleProblems: [], wrongCount: 0, unansweredCount: 0, emptyMessage: messages.noProblems,
      });
      expect(el.instance.findByType(Form.Switch)).toEqual([]);
      const [empty] = el.instance.findByType('p');
      expect(empty.children[0].el).toEqual(formatMessage(messages.noProblems));
    });
  });
});

describe('ProblemAnswers', () => {
  const renderProblem = (props = {}) => {
    el = shallow(<ProblemAnswers courseId={courseId} problem={{ ...problem, ...props }} headingId="heading" />);
  };
  test('snapshot', () => {
    renderProblem();
    expect(el.snapshot).toMatchSnapshot();
  });
  test('unit, name, status, points and attempts', () => {
    renderProblem();
    expect(el.instance.props['aria-labelledby']).toEqual('heading');
    expect(el.instance.findByType('h3')[0].children[0].el).toEqual(problem.name);
    expect(el.instance.findByType(StatusBadge)[0].props.problem).toEqual(problem);
    const meta = el.instance.findByType('span').map((span) => span.children[0].el);
    expect(meta).toEqual([
      formatMessage(messages.points, { earned: '0.5', possible: '2' }),
      formatMessage(messages.attempts, { count: 3 }),
    ]);
  });
  test('no points without a maximum, no attempts before a submission', () => {
    renderProblem({ possible: 0, attempts: 0 });
    expect(el.instance.findByType('span')).toEqual([]);
  });
  test('answers to each question', () => {
    renderProblem();
    expect(el.instance.findByType(Answer).map((answer) => answer.props.answer)).toEqual(problem.answers);
  });
  test('link to the problem in a new tab', () => {
    renderProblem();
    const [link] = el.instance.findByType(Hyperlink);
    expect(link.props.destination).toEqual(`http://localhost:18000/courses/${courseId}/jump_to/${problem.id}`);
    expect(link.props.target).toEqual('_blank');
  });
  test('saved, never submitted answer', () => {
    renderProblem({ saved: true, correctness: null });
    const [note] = el.instance.findByType('p').filter((p) => p.props.className === 'robbo-answers__note');
    expect(textOf(note)).toEqual(formatMessage(messages.savedNote));
  });
  test('saved answer after a submission: points of the previous one', () => {
    renderProblem({ saved: true });
    const [note] = el.instance.findByType('p').filter((p) => p.props.className === 'robbo-answers__note');
    expect(textOf(note)).toEqual(`${formatMessage(messages.savedNote)} ${formatMessage(messages.savedPointsNote)}`);
  });
  test('blocks whose answers are not shown', () => {
    renderProblem({ type: 'openassessment', answers: null });
    expect(el.instance.findByType(Answer)).toEqual([]);
    const [note] = el.instance.findByType('p').filter((p) => p.props.className === 'robbo-answers__note');
    expect(note.children[0].el).toEqual(formatMessage(messages.notShownNote));
  });
  test('unreadable problem', () => {
    renderProblem({ answers: [], answersError: true });
    expect(el.instance.findByType(Answer)).toEqual([]);
    const [note] = el.instance.findByType('p').filter((p) => p.props.className === 'robbo-answers__note');
    expect(note.children[0].el).toEqual(formatMessage(messages.readError));
  });
});

describe('Answer', () => {
  test('wrong answer with the correct one', () => {
    el = shallow(<Answer answer={wrongAnswer} />);
    expect(el.snapshot).toMatchSnapshot();
    expect(el.instance.findByType('dt').map((dt) => dt.children[0].el)).toEqual([
      formatMessage(messages.learnerAnswer), formatMessage(messages.correctAnswer),
    ]);
    const [icon] = el.instance.findByType(Icon);
    expect(icon.props.screenReaderText).toEqual(formatMessage(messages.incorrect));
    expect(icon.props.className).toEqual('robbo-answers__value-icon--incorrect');
  });
  test('right answer without the correct one', () => {
    el = shallow(<Answer answer={rightAnswer} />);
    expect(el.instance.findByType('dt').length).toEqual(1);
    expect(el.instance.findByType(Icon)[0].props.screenReaderText).toEqual(formatMessage(messages.correct));
  });
  test('empty answer of an unjudged question', () => {
    const answer = {
      question: '', answer: '', correctAnswer: '9', correctness: null,
    };
    el = shallow(<Answer answer={answer} />);
    expect(el.instance.findByType('p')).toEqual([]);
    expect(el.instance.findByType(Icon)).toEqual([]);
    const text = el.instance.findByType('span').find((span) => span.props.className.includes('text-muted'));
    expect(text.children[0].el).toEqual(formatMessage(messages.emptyAnswer));
  });
});

describe('StatusBadge', () => {
  const badge = (props) => shallow(<StatusBadge problem={{ ...problem, ...props }} />).instance;
  test.each([
    [correctness.correct, 'success', messages.correct],
    [correctness.incorrect, 'danger', messages.incorrect],
    [correctness.partiallyCorrect, 'warning', messages.partiallyCorrect],
  ])('%s', (value, variant, message) => {
    const instance = badge({ correctness: value });
    expect(instance.type).toEqual(Badge);
    expect(instance.props.variant).toEqual(variant);
    expect(instance.children[0].el).toEqual(formatMessage(message));
  });
  test('not submitted', () => {
    const instance = badge({ correctness: null, saved: true });
    expect(instance.props.variant).toEqual('light');
    expect(instance.children[0].el).toEqual(formatMessage(messages.notSubmitted));
  });
  test('no answer', () => {
    expect(badge({ correctness: null }).children[0].el).toEqual(formatMessage(messages.noAnswer));
  });
});
