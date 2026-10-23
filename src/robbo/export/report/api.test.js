/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 */
import { get } from 'data/services/lms/utils';

import { fetchLearners, fetchProgress } from './api';

jest.mock('data/services/lms/utils', () => ({
  ...jest.requireActual('data/services/lms/utils'),
  get: jest.fn(),
}));

const courseId = 'course-v1:Org+Course+Run';

describe('report api', () => {
  test('fetchLearners: the course name and its learners by last activity', async () => {
    get.mockResolvedValueOnce({ data: { course: { id: courseId, name: 'Robots' }, learners: [{ id: 1 }] } });
    await expect(fetchLearners(courseId)).resolves.toEqual({ courseName: 'Robots', learners: [{ id: 1 }] });
    expect(get).toHaveBeenCalledWith(`http://localhost:18000/api/robbo/v1/gradebook/${courseId}/learners/`);
  });
  test('fetchProgress: one learner', async () => {
    get.mockResolvedValueOnce({ data: { sections: [] } });
    await expect(fetchProgress(courseId, 42)).resolves.toEqual({ sections: [] });
    expect(get).toHaveBeenCalledWith(`http://localhost:18000/api/robbo/v1/gradebook/${courseId}/progress/?user_id=42`);
  });
});
