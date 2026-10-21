/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 *
 * «Ответы» tab of the modal opened from a grade: the problems of the assignment (subsection)
 * with the learner's last answers, the correct answers and which were wrong. Mistakes and open
 * responses awaiting grading only by default; the switch shows the rest too. Pictures of
 * the answers (choices, uploaded photos) are small until clicked; other files are links.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {
  Alert, Badge, Button, Form, Hyperlink, Icon, Spinner,
} from '@openedx/paragon';
import {
  Cancel, CheckCircle, Error as ErrorIcon, InsertDriveFile,
} from '@openedx/paragon/icons';
import { useIntl } from '@edx/frontend-platform/i18n';

import { fileUrl, problemUrl } from './api';
import {
  correctness, loadStatuses, useLearnerAnswersData, usePicture,
} from './hooks';
import messages from './messages';

const correctnessView = {
  [correctness.correct]: { message: messages.correct, variant: 'success', icon: CheckCircle },
  [correctness.incorrect]: { message: messages.incorrect, variant: 'danger', icon: Cancel },
  [correctness.partiallyCorrect]: { message: messages.partiallyCorrect, variant: 'warning', icon: ErrorIcon },
};

const fileShape = PropTypes.shape({
  url: PropTypes.string.isRequired,
  name: PropTypes.string,
  description: PropTypes.string,
  image: PropTypes.bool,
});

const answerShape = PropTypes.shape({
  question: PropTypes.string,
  answer: PropTypes.string,
  files: PropTypes.arrayOf(fileShape),
  correctAnswer: PropTypes.string,
  correctFiles: PropTypes.arrayOf(fileShape),
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
  awaitingGrade: PropTypes.bool,
});

/** Status of a problem for its badge and card: a correctness, awaiting grading or none. */
export const problemStatus = (problem) => (
  problem.correctness || (problem.awaitingGrade ? 'awaiting' : 'none')
);

export const StatusBadge = ({ problem }) => {
  const { formatMessage } = useIntl();
  const view = correctnessView[problem.correctness];
  if (view) {
    return <Badge variant={view.variant}>{formatMessage(view.message)}</Badge>;
  }
  if (problem.awaitingGrade) {
    return <Badge variant="light">{formatMessage(messages.awaitingGrade)}</Badge>;
  }
  return (
    <Badge variant="light">
      {formatMessage(problem.saved ? messages.notSubmitted : messages.noAnswer)}
    </Badge>
  );
};

StatusBadge.propTypes = { problem: problemShape.isRequired };

/** A picture of an answer: a thumbnail button that shows it full width and back. */
export const AnswerPicture = ({ file }) => {
  const { formatMessage } = useIntl();
  const {
    expanded, failed, toggle, handleError,
  } = usePicture();
  const name = file.description || file.name || formatMessage(messages.picture);
  if (failed) {
    return <li className="robbo-answers__picture-error">{formatMessage(messages.pictureError)}</li>;
  }
  return (
    <li className={classNames('robbo-answers__picture', expanded && 'robbo-answers__picture--expanded')}>
      <button
        type="button"
        className="robbo-answers__picture-button"
        aria-expanded={expanded}
        aria-label={formatMessage(expanded ? messages.hidePicture : messages.showPicture, { name })}
        onClick={toggle}
      >
        <img src={fileUrl(file.url)} alt="" loading="lazy" onError={handleError} />
      </button>
      {file.description && <span className="robbo-answers__picture-caption">{file.description}</span>}
    </li>
  );
};

AnswerPicture.propTypes = { file: fileShape.isRequired };

/** Files of an answer: pictures first (choices or photos), then links to the other files. */
export const AnswerFiles = ({ files }) => {
  const { formatMessage } = useIntl();
  const newTab = formatMessage(messages.opensInNewTab);
  const pictures = files.filter((file) => file.image);
  const others = files.filter((file) => !file.image);
  return (
    <>
      {pictures.length > 0 && (
        <ul className="robbo-answers__pictures">
          {pictures.map((file) => <AnswerPicture key={file.url} file={file} />)}
        </ul>
      )}
      {others.length > 0 && (
        <ul className="robbo-answers__files">
          {others.map((file) => (
            <li key={file.url} className="robbo-answers__file">
              <Icon src={InsertDriveFile} size="sm" className="robbo-answers__file-icon" />
              <span className="robbo-answers__file-name">{file.name}</span>
              {file.description && <span className="robbo-answers__file-description">{file.description}</span>}
              <Hyperlink
                destination={fileUrl(file.url)}
                target="_blank"
                externalLinkAlternativeText={newTab}
                externalLinkTitle={newTab}
              >
                {formatMessage(messages.downloadFile)}
              </Hyperlink>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

AnswerFiles.propTypes = { files: PropTypes.arrayOf(fileShape).isRequired };

/** The text of an answer and its files; «no answer» only when there is neither. */
export const AnswerValue = ({ text, files, mark }) => {
  const { formatMessage } = useIntl();
  const hasFiles = files?.length > 0;
  return (
    <dd className="robbo-answers__value">
      <span className="robbo-answers__value-mark">{mark}</span>
      <div className="robbo-answers__value-body">
        {(text || !hasFiles) && (
          <span className={classNames('robbo-answers__value-text', !text && 'text-muted')}>
            {text || formatMessage(messages.emptyAnswer)}
          </span>
        )}
        {hasFiles && <AnswerFiles files={files} />}
      </div>
    </dd>
  );
};

AnswerValue.propTypes = {
  text: PropTypes.string,
  files: PropTypes.arrayOf(fileShape),
  mark: PropTypes.node,
};

AnswerValue.defaultProps = { text: '', files: [], mark: null };

export const Answer = ({ answer }) => {
  const { formatMessage } = useIntl();
  const view = correctnessView[answer.correctness];
  const showCorrect = (answer.correctAnswer || answer.correctFiles?.length > 0)
    && answer.correctness !== correctness.correct;
  return (
    <li className="robbo-answers__question">
      {answer.question && <p className="robbo-answers__question-text">{answer.question}</p>}
      <dl className="robbo-answers__values">
        <dt>{formatMessage(messages.learnerAnswer)}</dt>
        <AnswerValue
          text={answer.answer}
          files={answer.files}
          mark={view && (
            <Icon
              src={view.icon}
              size="sm"
              className={`robbo-answers__value-icon--${answer.correctness}`}
              screenReaderText={formatMessage(view.message)}
            />
          )}
        />
        {showCorrect && (
          <>
            <dt>{formatMessage(messages.correctAnswer)}</dt>
            <AnswerValue text={answer.correctAnswer} files={answer.correctFiles} />
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
    <li
      className={`robbo-answers__problem robbo-answers__problem--${problemStatus(problem)}`}
      aria-labelledby={headingId}
    >
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
    awaitingCount,
    canFilter,
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
            {formatMessage(canFilter ? messages.summary : messages.summaryAll, {
              wrong: wrongCount, total: problems.length,
            })}
            {unansweredCount > 0 && `, ${formatMessage(messages.summaryUnanswered, { count: unansweredCount })}`}
            {awaitingCount > 0 && `, ${formatMessage(messages.summaryAwaiting, { count: awaitingCount })}`}
          </p>
          {canFilter && (
            <Form.Switch
              className="robbo-answers__switch"
              checked={onlyErrors}
              onChange={handleOnlyErrorsChange}
            >
              {formatMessage(messages.onlyErrors)}
            </Form.Switch>
          )}
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
