/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 *
 * LMS API of the PDF report (openedx-platform lms/djangoapps/robbo_gradebook/progress.py).
 */
import { getConfig } from '@edx/frontend-platform';

import { get, stringifyUrl } from 'data/services/lms/utils';

const reportUrl = (courseId, path) => `${getConfig().LMS_BASE_URL}/api/robbo/v1/gradebook/${courseId}/${path}/`;

/**
 * @return {Promise} { courseName, learners: [{ id, username, fullName, email, lastActivity }] },
 *   last active first
 */
export const fetchLearners = (courseId) => get(reportUrl(courseId, 'learners'))
  .then(({ data }) => ({ courseName: data.course?.name || null, learners: data.learners }));

/**
 * @return {Promise} { learner, percent, passedUnits, units, sections: [{ name, subsections:
 *   [{ id, name, graded, earned, possible, units: [{ name, earned, possible, passed }] }] }] }
 */
export const fetchProgress = (courseId, userId) => get(stringifyUrl(reportUrl(courseId, 'progress'), { user_id: userId }))
  .then(({ data }) => data);
