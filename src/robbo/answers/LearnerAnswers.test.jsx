/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 */
import React from 'react';
import { shallow } from '@edx/react-unit-test-utils';

import {
  Alert, Badge, Form, Hyperlink, Spinner,
} from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';

import { formatMessage } from 'testUtils';

import {
  correctness, loadStatuses, useLearnerAnswersData, usePicture,
} from './hooks';
import LearnerAnswers, {
  Answer, AnswerFiles, AnswerPicture, AnswerValue, ProblemAnswers, StatusBadge, problemStatus,
} from './LearnerAnswers';
import messages from './messages';

jest.mock('./hooks', () => ({
  ...jest.requireActual('./hooks'),
  useLearnerAnswersData: jest.fn(),
  usePicture: jest.fn(),
}));

useIntl.mockReturnValue({ formatMessage, formatNumber: (value) => `${value}` });

const courseId = 'course-v1:Org+Course+Run';
const wrongAnswer = {
  question: 'How many wheels?', answer: 'Two', correctAnswer: 'Four', correctness: correctness.incorrect,
};
const photo = {
  url: '/openassessment/storage/photo', name: 'robot.jpg', description: 'Front view', image: true,
};
const program = {
  url: '/openassessment/storage/program', name: 'robot.sb3', description: 'Program', image: false,
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
  awaitingCount: 0,
  canFilter: true,
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
    test('summary with open responses awaiting grading', () => {
      render({ unansweredCount: 0, awaitingCount: 2 });
      const [summary] = el.instance.findByType('p');
      expect(textOf(summary)).toEqual(
        `${formatMessage(messages.summary, { wrong: 1, total: 3 })}, `
        + `${formatMessage(messages.summaryAwaiting, { count: 2 })}`,
      );
    });
    test('nothing to filter: all problems in the summary, no switch', () => {
      render({ canFilter: false, unansweredCount: 0 });
      const [summary] = el.instance.findByType('p');
      expect(textOf(summary)).toEqual(formatMessage(messages.summaryAll, { wrong: 1, total: 3 }));
      expect(el.instance.findByType(Form.Switch)).toEqual([]);
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
  test('the card shows the status of the problem', () => {
    renderProblem();
    expect(el.instance.props.className).toEqual('robbo-answers__problem robbo-answers__problem--partially-correct');
    renderProblem({ correctness: null, awaitingGrade: true });
    expect(el.instance.props.className).toEqual('robbo-answers__problem robbo-answers__problem--awaiting');
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
  const values = () => el.instance.findByType(AnswerValue);
  test('wrong answer with the correct one', () => {
    el = shallow(<Answer answer={wrongAnswer} />);
    expect(el.snapshot).toMatchSnapshot();
    expect(el.instance.findByType('dt').map((dt) => dt.children[0].el)).toEqual([
      formatMessage(messages.learnerAnswer), formatMessage(messages.correctAnswer),
    ]);
    const [learner, correct] = values();
    expect(learner.props.text).toEqual(wrongAnswer.answer);
    expect(learner.props.mark.props.screenReaderText).toEqual(formatMessage(messages.incorrect));
    expect(learner.props.mark.props.className).toEqual('robbo-answers__value-icon--incorrect');
    expect(correct.props.text).toEqual(wrongAnswer.correctAnswer);
  });
  test('right answer without the correct one', () => {
    el = shallow(<Answer answer={rightAnswer} />);
    expect(el.instance.findByType('dt').length).toEqual(1);
    expect(values()[0].props.mark.props.screenReaderText).toEqual(formatMessage(messages.correct));
  });
  test('unjudged answer has no mark', () => {
    el = shallow(<Answer answer={{
      question: '', answer: '', correctAnswer: '9', correctness: null,
    }}
    />);
    expect(el.instance.findByType('p')).toEqual([]);
    expect(values()[0].props.mark).toBeFalsy();
  });
  test('pictures of the answer and of the correct choice', () => {
    const answer = {
      ...wrongAnswer, answer: '', files: [photo], correctAnswer: '', correctFiles: [{ ...photo, url: '/right' }],
    };
    el = shallow(<Answer answer={answer} />);
    const [learner, correct] = values();
    expect(learner.props.files).toEqual([photo]);
    expect(correct.props.files).toEqual(answer.correctFiles);
  });
});

describe('AnswerValue', () => {
  const spans = () => el.instance.findByType('span');
  test('text with its mark', () => {
    el = shallow(<AnswerValue text="Two" mark="mark" />);
    expect(el.snapshot).toMatchSnapshot();
    expect(spans()[1].children[0].el).toEqual('Two');
    expect(el.instance.findByType(AnswerFiles)).toEqual([]);
  });
  test('no answer without text and files', () => {
    el = shallow(<AnswerValue />);
    const text = spans().find((span) => span.props.className.includes('text-muted'));
    expect(text.children[0].el).toEqual(formatMessage(messages.emptyAnswer));
  });
  test('files only: no «no answer»', () => {
    el = shallow(<AnswerValue files={[photo]} />);
    expect(spans().length).toEqual(1); // the mark column
    expect(el.instance.findByType(AnswerFiles)[0].props.files).toEqual([photo]);
  });
});

describe('AnswerFiles', () => {
  test('pictures first, links to the other files', () => {
    el = shallow(<AnswerFiles files={[program, photo]} />);
    expect(el.snapshot).toMatchSnapshot();
    expect(el.instance.findByType(AnswerPicture).map((item) => item.props.file)).toEqual([photo]);
    const [link] = el.instance.findByType(Hyperlink);
    expect(link.props.destination).toEqual(`http://localhost:18000${program.url}`);
    expect(link.props.target).toEqual('_blank');
    expect(link.children[0].el).toEqual(formatMessage(messages.downloadFile));
  });
  test('no lists without files of their kind', () => {
    el = shallow(<AnswerFiles files={[photo]} />);
    expect(el.instance.findByType(Hyperlink)).toEqual([]);
  });
});

describe('AnswerPicture', () => {
  const picture = {
    expanded: false,
    failed: false,
    toggle: jest.fn().mockName('usePicture.toggle'),
    handleError: jest.fn().mockName('usePicture.handleError'),
  };
  const renderPicture = (props = {}, file = photo) => {
    usePicture.mockReturnValue({ ...picture, ...props });
    el = shallow(<AnswerPicture file={file} />);
  };
  test('small picture button', () => {
    renderPicture();
    expect(el.snapshot).toMatchSnapshot();
    const [button] = el.instance.findByType('button');
    expect(button.props['aria-expanded']).toEqual(false);
    expect(button.props['aria-label']).toEqual(formatMessage(messages.showPicture, { name: photo.description }));
    expect(button.props.onClick).toEqual(picture.toggle);
    const [img] = el.instance.findByType('img');
    expect(img.props.src).toEqual(`http://localhost:18000${photo.url}`);
    expect(img.props.onError).toEqual(picture.handleError);
  });
  test('enlarged picture', () => {
    renderPicture({ expanded: true }, { url: 'https://example.com/a.png', name: 'Code A', image: true });
    expect(el.instance.props.className).toContain('robbo-answers__picture--expanded');
    const [button] = el.instance.findByType('button');
    expect(button.props['aria-label']).toEqual(formatMessage(messages.hidePicture, { name: 'Code A' }));
    expect(el.instance.findByType('img')[0].props.src).toEqual('https://example.com/a.png');
    expect(el.instance.findByType('span')).toEqual([]);
  });
  test('a picture without a name', () => {
    renderPicture({}, { url: '/a.png', image: true });
    const [button] = el.instance.findByType('button');
    expect(button.props['aria-label']).toEqual(
      formatMessage(messages.showPicture, { name: formatMessage(messages.picture) }),
    );
  });
  test('a note instead of a picture that did not load', () => {
    renderPicture({ failed: true });
    expect(el.instance.findByType('img')).toEqual([]);
    expect(el.instance.children[0].el).toEqual(formatMessage(messages.pictureError));
  });
});

describe('problemStatus', () => {
  test.each([
    [{ correctness: correctness.incorrect }, correctness.incorrect],
    [{ correctness: null, awaitingGrade: true }, 'awaiting'],
    [{ correctness: null }, 'none'],
  ])('%j', (value, status) => {
    expect(problemStatus(value)).toEqual(status);
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
  test('open response awaiting grading', () => {
    const instance = badge({ correctness: null, awaitingGrade: true });
    expect(instance.props.variant).toEqual('light');
    expect(instance.children[0].el).toEqual(formatMessage(messages.awaitingGrade));
  });
});
