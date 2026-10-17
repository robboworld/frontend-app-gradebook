/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 *
 * «Ответы» tab of the modal opened from a grade: the problems of the assignment (subsection)
 * with the learner's last answers, the correct answers and which were wrong. Problems with
 * mistakes only by default; the switch shows the correct and unanswered ones too.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {
  Alert, Badge, Button, Form, Hyperlink, Icon, Spinner,
} from '@openedx/paragon';
import { Cancel, CheckCircle, Error as ErrorIcon } from '@openedx/paragon/icons';
import { useIntl } from '@edx/frontend-platform/i18n';

import { problemUrl } from './api';
import { correctness, loadStatuses, useLearnerAnswersData } from './hooks';
import messages from './messages';

const correctnessView = {
  [correctness.correct]: { message: messages.correct, variant: 'success', icon: CheckCircle },
  [correctness.incorrect]: { message: messages.incorrect, variant: 'danger', icon: Cancel },
  [correctness.partiallyCorrect]: { message: messages.partiallyCorrect, variant: 'warning', icon: ErrorIcon },
};

const answerShape = PropTypes.shape({
  question: PropTypes.string,
  answer: PropTypes.string,
  correctAnswer: PropTypes.string,
  correctness: PropTypes.string,
});

const problemShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string,
  unitName: PropTypes.string,
  earned: PropTypes.number,
  possible: PropTypes.number,
  attempts: PropTypes.number,
  saved: PropTypes.bool,
  correctness: PropTypes.string,
  answers: PropTypes.arrayOf(answerShape),
  answersError: PropTypes.bool,
});

export const StatusBadge = ({ problem }) => {
  const { formatMessage } = useIntl();
  const view = correctnessView[problem.correctness];
  if (view) {
    return <Badge variant={view.variant}>{formatMessage(view.message)}</Badge>;
  }
  return (
    <Badge variant="light">
      {formatMessage(problem.saved ? messages.notSubmitted : messages.noAnswer)}
    </Badge>
  );
};

StatusBadge.propTypes = { problem: problemShape.isRequired };

export const Answer = ({ answer }) => {
  const { formatMessage } = useIntl();
  const view = correctnessView[answer.correctness];
  const showCorrect = answer.correctAnswer && answer.correctness !== correctness.correct;
  return (
    <li className="robbo-answers__question">
      {answer.question && <p className="robbo-answers__question-text">{answer.question}</p>}
      <dl className="robbo-answers__values">
        <dt>{formatMessage(messages.learnerAnswer)}</dt>
        <dd className="robbo-answers__value">
          <span className="robbo-answers__value-mark">
            {view && (
              <Icon
                src={view.icon}
                size="sm"
                className={`robbo-answers__value-icon--${answer.correctness}`}
                screenReaderText={formatMessage(view.message)}
              />
            )}
          </span>
          <span className={classNames('robbo-answers__value-text', !answer.answer && 'text-muted')}>
            {answer.answer || formatMessage(messages.emptyAnswer)}
          </span>
        </dd>
        {showCorrect && (
          <>
            <dt>{formatMessage(messages.correctAnswer)}</dt>
            <dd className="robbo-answers__value">
              <span className="robbo-answers__value-mark" />
              <span className="robbo-answers__value-text">{answer.correctAnswer}</span>
            </dd>
          </>
        )}
      </dl>
    </li>
  );
};

Answer.propTypes = { answer: answerShape.isRequired };

export const ProblemAnswers = ({ courseId, problem, headingId }) => {
  const { formatMessage, formatNumber } = useIntl();
  const newTab = formatMessage(messages.opensInNewTab);
  const points = (value) => formatNumber(value, { maximumFractionDigits: 2 });
  return (
    <li className="robbo-answers__problem" aria-labelledby={headingId}>
      <div className="robbo-answers__problem-header">
        <div className="robbo-answers__problem-title">
          {problem.unitName && <p className="robbo-answers__unit">{problem.unitName}</p>}
          <h3 id={headingId} className="robbo-answers__name">{problem.name}</h3>
        </div>
        <div className="robbo-answers__problem-meta">
          <StatusBadge problem={problem} />
          {problem.possible > 0 && (
            <span>
              {formatMessage(messages.points, {
                earned: points(problem.earned ?? 0), possible: points(problem.possible),
              })}
            </span>
          )}
          {problem.attempts > 0 && <span>{formatMessage(messages.attempts, { count: problem.attempts })}</span>}
        </div>
      </div>

      {problem.saved && (
        <p className="robbo-answers__note">
          {formatMessage(messages.savedNote)}
          {problem.correctness && ` ${formatMessage(messages.savedPointsNote)}`}
        </p>
      )}
      {problem.answers === null && <p className="robbo-answers__note">{formatMessage(messages.notShownNote)}</p>}
      {problem.answersError && <p className="robbo-answers__note">{formatMessage(messages.readError)}</p>}
      {problem.answers?.length > 0 && (
        <ul className="robbo-answers__questions">
          {problem.answers.map((answer, index) => (
            // Inputs of one problem have no ids of their own here; their order is fixed.
            // eslint-disable-next-line react/no-array-index-key
            <Answer key={index} answer={answer} />
          ))}
        </ul>
      )}

      <Hyperlink
        className="robbo-answers__link"
        destination={problemUrl(courseId, problem.id)}
        target="_blank"
        externalLinkAlternativeText={newTab}
        externalLinkTitle={newTab}
      >
        {formatMessage(messages.openInCourse)}
      </Hyperlink>
    </li>
  );
};

ProblemAnswers.propTypes = {
  courseId: PropTypes.string.isRequired,
  problem: problemShape.isRequired,
  headingId: PropTypes.string.isRequired,
};

export const LearnerAnswers = () => {
  const { formatMessage } = useIntl();
  const {
    courseId,
    status,
    retry,
    problems,
    visibleProblems,
    wrongCount,
    unansweredCount,
    onlyErrors,
    handleOnlyErrorsChange,
    emptyMessage,
  } = useLearnerAnswersData();

  if (status === loadStatuses.loading) {
    return (
      <div className="robbo-answers__loading">
        <Spinner animation="border" variant="primary" screenReaderText={formatMessage(messages.loading)} />
      </div>
    );
  }
  if (status === loadStatuses.failed) {
    return (
      <Alert
        variant="danger"
        className="robbo-answers__alert"
        actions={[<Button key="retry" variant="outline-danger" onClick={retry}>{formatMessage(messages.retry)}</Button>]}
      >
        {formatMessage(messages.loadError)}
      </Alert>
    );
  }

  return (
    <div className="robbo-answers">
      {problems.length > 0 && (
        <div className="robbo-answers__toolbar">
          <p className="robbo-answers__summary">
            {formatMessage(messages.summary, { wrong: wrongCount, total: problems.length })}
            {unansweredCount > 0 && `, ${formatMessage(messages.summaryUnanswered, { count: unansweredCount })}`}
          </p>
          <Form.Switch
            className="robbo-answers__switch"
            checked={onlyErrors}
            onChange={handleOnlyErrorsChange}
          >
            {formatMessage(messages.onlyErrors)}
          </Form.Switch>
        </div>
      )}
      {visibleProblems.length === 0 ? (
        <p className="robbo-answers__empty">{formatMessage(emptyMessage)}</p>
      ) : (
        <ol className="robbo-answers__list" aria-label={formatMessage(messages.listLabel)}>
          {visibleProblems.map((problem, index) => (
            <ProblemAnswers
              key={problem.id}
              courseId={courseId}
              problem={problem}
              headingId={`robbo-answers-problem-${index}`}
            />
          ))}
        </ol>
      )}
    </div>
  );
};

export default LearnerAnswers;
