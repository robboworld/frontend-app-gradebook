/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 */
import { get } from 'data/services/lms/utils';

import { fetchLearnerAnswers, problemUrl } from './api';

jest.mock('data/services/lms/utils', () => ({
  ...jest.requireActual('data/services/lms/utils'),
  get: jest.fn(),
}));

const courseId = 'course-v1:Org+Course+Run';
const subsectionId = 'block-v1:Org+Course+Run+type@sequential+block@hw1';
const problemId = 'block-v1:Org+Course+Run+type@problem+block@mc';

describe('answers api', () => {
  test('fetchLearnerAnswers asks the LMS for the learner and the subsection', async () => {
    const problems = [{ id: problemId }];
    get.mockResolvedValueOnce({ data: { problems } });
    await expect(fetchLearnerAnswers(courseId, 42, subsectionId)).resolves.toEqual(problems);
    const [[url]] = get.mock.calls;
    const parsed = new URL(url);
    expect(`${parsed.origin}${parsed.pathname}`).toEqual(
      `http://localhost:18000/api/robbo/v1/gradebook/${courseId}/answers/`,
    );
    expect(parsed.searchParams.get('user_id')).toEqual('42');
    expect(parsed.searchParams.get('subsection')).toEqual(subsectionId);
  });
  test('problemUrl leads to the problem in the course', () => {
    expect(problemUrl(courseId, problemId)).toEqual(
      `http://localhost:18000/courses/${courseId}/jump_to/${problemId}`,
    );
  });
});
