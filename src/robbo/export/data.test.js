/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 */
import { GradeFormats, Headings } from 'data/constants/grades';
import lms from 'data/services/lms';
import { get } from 'data/services/lms/utils';
import { formatMessage } from 'testUtils';
import tableMessages from 'components/GradesView/GradebookTable/messages';

import * as data from './data';

jest.mock('data/services/lms', () => ({ api: { fetch: { gradebookData: jest.fn() } } }));
jest.mock('data/services/lms/utils', () => ({ get: jest.fn() }));
jest.mock('data/selectors', () => {
  const { roundGrade, subsectionGrade } = jest.requireActual('data/selectors/grades');
  return {
    __esModule: true,
    default: {
      grades: { roundGrade, subsectionGrade, gradeFormat: jest.fn(() => 'percent') },
      root: {
        localFilters: jest.fn(() => ({ searchText: 'ivan', assignment: 'hw1', includeCourseRoleMembers: false })),
        getHeadings: jest.fn(() => ['Username', 'HW 01']),
      },
      app: { courseId: jest.fn(() => 'course-v1:Org+Course+Run') },
      filters: { cohort: jest.fn(() => 3), track: jest.fn(() => 'audit') },
    },
  };
});

const headings = [Headings.username, Headings.fullName, Headings.email, 'HW 01', 'HW 02', Headings.totalGrade];
const entry = {
  username: 'ivan',
  full_name: 'Иван Иванов',
  email: 'ivan@example.com',
  percent: 0.0952,
  section_breakdown: [
    {
      label: 'HW 01', percent: 0.0952, score_earned: 2, score_possible: 21, attempted: true,
    },
    {
      label: 'HW 02', percent: 0, score_earned: 0, score_possible: 5, attempted: false,
    },
  ],
};

describe('export data', () => {
  test('exportSubject: filters, columns and format of the moment', () => {
    expect(data.exportSubject({})).toEqual({
      courseId: 'course-v1:Org+Course+Run',
      headings: ['Username', 'HW 01'],
      gradeFormat: 'percent',
      searchText: 'ivan',
      cohort: 3,
      track: 'audit',
      options: { assignment: 'hw1', includeCourseRoleMembers: false },
    });
  });

  describe('fetchAllGrades', () => {
    const subject = {
      searchText: 'ivan', cohort: 3, track: 'audit', options: { assignment: 'hw1' },
    };
    test('every page, sorted like the table, with progress', async () => {
      lms.api.fetch.gradebookData.mockResolvedValueOnce({
        data: { results: [{ username: 'zoe' }], next: 'http://next/1', filtered_users_count: 3 },
      });
      get.mockResolvedValueOnce({ data: { results: [{ username: 'anna' }], next: 'http://next/2', filtered_users_count: 3 } })
        .mockResolvedValueOnce({ data: { results: [{ username: 'Boris' }], next: null, filtered_users_count: 3 } });
      const onProgress = jest.fn();
      const grades = await data.fetchAllGrades(subject, onProgress);
      expect(grades.map(({ username }) => username)).toEqual(['anna', 'Boris', 'zoe']);
      expect(lms.api.fetch.gradebookData).toHaveBeenCalledWith(
        'ivan',
        3,
        'audit',
        { assignment: 'hw1', pageSize: data.EXPORT_PAGE_SIZE },
      );
      expect(get.mock.calls).toEqual([['http://next/1'], ['http://next/2']]);
      expect(onProgress.mock.calls).toEqual([[1, 3], [2, 3], [3, 3]]);
    });
  });

  test('exportColumns: table titles for the learner columns, labels of the assignments', () => {
    expect(data.exportColumns(headings, formatMessage)).toEqual([
      formatMessage(tableMessages.usernameHeading),
      formatMessage(tableMessages.fullNameHeading),
      formatMessage(tableMessages.emailHeading),
      'HW 01',
      'HW 02',
      formatMessage(tableMessages.totalGradeHeading),
    ]);
  });

  describe('exportRow', () => {
    test('percent', () => {
      expect(data.exportRow(entry, headings, GradeFormats.percent))
        .toEqual(['ivan', 'Иван Иванов', 'ivan@example.com', 9.52, 0, 9.52]);
    });
    test('points; a missing assignment is empty', () => {
      expect(data.exportRow({ ...entry, full_name: null }, [...headings, 'HW 03'], GradeFormats.absolute))
        .toEqual(['ivan', '', 'ivan@example.com', '2/21', '0', 9.52, '']);
    });
  });

  test('cellText: decimal comma in Russian', () => {
    expect(data.cellText(9.52, 'ru')).toEqual('9,52');
    expect(data.cellText(9.52, 'en')).toEqual('9.52');
    expect(data.cellText(null)).toEqual('');
  });

  describe('toCsv', () => {
    test('BOM, semicolons, CRLF, decimal commas', () => {
      expect(data.toCsv(['Имя', 'HW 01'], [['ivan', 9.52], ['anna', 100]], 'ru'))
        .toEqual('\uFEFFИмя;HW 01\r\nivan;9,52\r\nanna;100\r\n');
    });
    test('quotes and formulas are made safe', () => {
      expect(data.toCsv(['a'], [['say "hi"; bye'], ['=HYPERLINK("x")'], ['-1'], [-1]], 'ru'))
        .toEqual('\uFEFFa\r\n"say ""hi""; bye"\r\n"\'=HYPERLINK(""x"")"\r\n\'-1\r\n-1\r\n');
    });
  });

  test('exportFileName: title, course and day without forbidden characters', () => {
    expect(data.exportFileName('Журнал оценок', 'Robots: level 1/2', new Date(2026, 9, 1)))
      .toEqual('Журнал оценок – Robots level 1 2 – 2026-10-01');
  });

  test('downloadFile: a link to a blob with the file name', () => {
    URL.createObjectURL = jest.fn(() => 'blob:1');
    URL.revokeObjectURL = jest.fn();
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    data.downloadFile('a;b', 'grades.csv', 'text/csv');
    const [[blob]] = URL.createObjectURL.mock.calls;
    expect(blob.type).toEqual('text/csv');
    expect(click).toHaveBeenCalled();
    expect(click.mock.contexts[0].download).toEqual('grades.csv');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:1');
    expect(document.querySelector('a[download]')).toBeNull();
    click.mockRestore();
  });
});
