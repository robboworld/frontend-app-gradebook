/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 *
 * LMS API of «Ответы учащегося» (openedx-platform lms/djangoapps/robbo_gradebook/answers.py).
 */
import { getConfig } from '@edx/frontend-platform';

import { get, stringifyUrl } from 'data/services/lms/utils';

/**
 * @return {Promise} [{ id, type, name, unitName, earned, possible, graded, attempts, saved,
 *   correctness, answers: [{ question, answer, files, correctAnswer, correctFiles, correctness }] | null,
 *   answersError, awaitingGrade }]; files: [{ url, name, description, image }]
 */
export const fetchLearnerAnswers = (courseId, userId, subsectionId) => get(stringifyUrl(
  `${getConfig().LMS_BASE_URL}/api/robbo/v1/gradebook/${courseId}/answers/`,
  { user_id: userId, subsection: subsectionId },
)).then(({ data }) => data.problems);

/** The problem in the course (LMS jump_to leads to its unit). */
export const problemUrl = (courseId, problemId) => (
  `${getConfig().LMS_BASE_URL}/courses/${courseId}/jump_to/${problemId}`
);

/** Files of the answers: course assets and uploaded files come with LMS paths. */
export const fileUrl = (url) => (
  url.startsWith('/') && !url.startsWith('//') ? `${getConfig().LMS_BASE_URL}${url}` : url
);
