/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 *
 * The course name for the gradebook header (the LMS courses API); null until it loads or when it
 * cannot be read, so the header keeps the course id then.
 */
/* eslint-disable import/no-self-import */
import React, { useEffect } from 'react';
import { getConfig } from '@edx/frontend-platform';

import { get } from 'data/services/lms/utils';

import * as module from './useCourseName';

// useState behind an object, so that tests can mock it (testUtils MockUseState).
export const state = {
  courseName: (val) => React.useState(val), // eslint-disable-line
};

export const fetchCourseName = (courseId) => get(
  `${getConfig().LMS_BASE_URL}/api/courses/v1/courses/${courseId}/`,
).then(({ data }) => data.name || null);

export const useCourseName = (courseId) => {
  const [courseName, setCourseName] = module.state.courseName(null);
  useEffect(() => {
    if (!courseId) {
      return undefined;
    }
    let isCurrent = true;
    module.fetchCourseName(courseId)
      .then((name) => isCurrent && setCourseName(name))
      .catch(() => {}); // the header shows the course id
    return () => { isCurrent = false; };
  }, [courseId, setCourseName]);
  return courseName;
};

export default useCourseName;
