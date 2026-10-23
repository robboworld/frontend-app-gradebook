/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 */
import { formatMessage } from 'testUtils';

import * as pdf from './pdf';
import messages from './messages';

jest.mock('jspdf', () => ({ jsPDF: 'JsPdf' }));
jest.mock('jspdf-autotable', () => ({ autoTable: 'autoTable' }));

const progress = (sections, extra = {}) => ({
  percent: 0.5, passedUnits: 1, units: 2, sections, ...extra,
});
const homework = {
  name: 'Homework 1',
  graded: true,
  earned: 3,
  possible: 4,
  units: [
    {
      name: 'Unit 1', earned: 2, possible: 2, passed: true,
    },
    {
      name: 'Unit 2', earned: 1, possible: 2, passed: false,
    },
  ],
};
const practice = {
  name: 'Practice',
  graded: false,
  earned: 0.5,
  possible: 1,
  units: [{
    name: 'Unit 3', earned: 0.5, possible: 1, passed: false,
  }],
};
const sections = [{ name: 'Section 1', subsections: [homework, practice] }];

/** A jsPDF stand-in that remembers what was drawn. */
const fakeDoc = () => {
  const doc = {
    pages: 1,
    texts: [],
    rects: [],
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    addFileToVFS: jest.fn(),
    addFont: jest.fn(),
    setFont: jest.fn(),
    setFontSize: jest.fn(),
    setTextColor: jest.fn(),
    setFillColor: jest.fn((color) => { doc.fill = color; }),
    setDrawColor: jest.fn(),
    setLineWidth: jest.fn(),
    line: jest.fn(),
    rect: jest.fn((...args) => doc.rects.push({ args, fill: doc.fill })),
    splitTextToSize: jest.fn((text) => (Array.isArray(text) ? text : [text])),
    text: jest.fn((text, x, y) => doc.texts.push({ text: [].concat(text).join(' '), page: doc.page || doc.pages, y })),
    addPage: jest.fn(() => { doc.pages += 1; doc.page = doc.pages; }),
    getNumberOfPages: jest.fn(() => doc.pages),
    setPage: jest.fn((page) => { doc.page = page; }),
  };
  return doc;
};

const tools = (doc) => {
  const autoTable = jest.fn((target, options) => {
    Object.assign(target, { tables: [...(target.tables || []), options], lastAutoTable: { finalY: 120 } });
  });
  // eslint-disable-next-line prefer-arrow-callback, func-names
  const JsPdf = jest.fn(function () { return doc; });
  return { JsPdf, autoTable, fonts: { regular: 'R', bold: 'B' } };
};

const learner = (fullName, username) => ({
  id: username.length, username, fullName, email: `${username}@example.com`,
});

describe('PDF report', () => {
  test('learnerName: full name, else username', () => {
    expect(pdf.learnerName(learner('Анна', 'anna'))).toEqual('Анна');
    expect(pdf.learnerName(learner('', 'zoe'))).toEqual('zoe');
  });

  test('sortReports: alphabetical, Russian collation', () => {
    const reports = [learner('Борис', 'b'), learner('', 'alex'), learner('Анна', 'a')].map((l) => ({ learner: l }));
    expect(pdf.sortReports(reports, 'ru').map((r) => pdf.learnerName(r.learner))).toEqual(['Анна', 'Борис', 'alex']);
  });

  test('tableRows: every unit with its section and subsection, points, status', () => {
    expect(pdf.tableRows(progress(sections), formatMessage, 'ru')).toEqual([
      {
        section: 'Section 1', subsection: 'Homework 1', unit: 'Unit 1', points: '2 of 2', passed: true,
      },
      {
        section: 'Section 1', subsection: 'Homework 1', unit: 'Unit 2', points: '1 of 2', passed: false,
      },
      {
        section: 'Section 1',
        subsection: formatMessage(messages.ungraded, { name: 'Practice' }),
        unit: 'Unit 3',
        points: '0,5 of 1',
        passed: false,
      },
    ]);
  });

  test('chartBars: one bar per subsection, percent of its points', () => {
    expect(pdf.chartBars(progress([...sections, { name: 'S2', subsections: [{ ...practice, possible: 0, earned: 0 }] }])))
      .toEqual([
        {
          label: 'Homework 1', earned: 3, possible: 4, percent: 75,
        },
        {
          label: 'Practice', earned: 0.5, possible: 1, percent: 50,
        },
        {
          label: 'Practice', earned: 0, possible: 0, percent: 0,
        },
      ]);
  });

  describe('loadPdfTools', () => {
    test('jsPDF, autoTable and both fonts as base64', async () => {
      global.fetch = jest.fn(() => Promise.resolve({
        ok: true, arrayBuffer: () => Promise.resolve(new Uint8Array([104, 105]).buffer),
      }));
      const loaded = await pdf.loadPdfTools();
      expect(loaded).toEqual({ JsPdf: 'JsPdf', autoTable: 'autoTable', fonts: { regular: 'aGk=', bold: 'aGk=' } });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
    test('a missing font fails the report', async () => {
      global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 404 }));
      await expect(pdf.loadPdfTools()).rejects.toThrow('404');
    });
  });

  describe('buildReport', () => {
    let doc;
    let used;
    const build = (reports) => {
      doc = fakeDoc();
      used = tools(doc);
      return pdf.buildReport(used, {
        reports, courseName: 'Robots', formatMessage, locale: 'ru',
      });
    };
    const reports = [
      { learner: learner('Борис Петров', 'boris'), lastActivity: null, progress: progress(sections) },
      { learner: learner('Анна Смирнова', 'anna'), lastActivity: '2026-10-20T16:05:00Z', progress: progress(sections) },
    ];

    test('the Cyrillic font is registered', () => {
      build(reports);
      expect(doc.addFont.mock.calls).toEqual([
        ['DejaVuSans.ttf', pdf.FONT, 'normal'],
        ['DejaVuSans-Bold.ttf', pdf.FONT, 'bold'],
      ]);
      expect(doc.addFileToVFS).toHaveBeenCalledWith('DejaVuSans.ttf', 'R');
    });
    test('learners alphabetically, each from a new page', () => {
      build(reports);
      expect(doc.addPage).toHaveBeenCalledTimes(1);
      const names = doc.texts.filter((t) => ['Анна Смирнова', 'Борис Петров'].includes(t.text));
      expect(names.map((t) => [t.text, t.page])).toEqual([['Анна Смирнова', 1], ['Борис Петров', 2]]);
    });
    test('header: contacts, course, activity, summary', () => {
      build(reports.slice(0, 1));
      const texts = doc.texts.map((t) => t.text);
      expect(texts).toContain(`${formatMessage(messages.username, { username: 'boris' })}   ·   ${
        formatMessage(messages.email, { email: 'boris@example.com' })}`);
      expect(texts).toContain(formatMessage(messages.course, { name: 'Robots' }));
      expect(texts).toContain(formatMessage(messages.noActivity));
      expect(texts).toContain(formatMessage(messages.summary, { percent: '50', passed: 1, total: 2 }));
    });
    test('table: section, subsection, unit, points, status; repeated names greyed, passed in green', () => {
      build(reports.slice(0, 1));
      const [table] = doc.tables;
      expect(table.head[0]).toEqual([
        formatMessage(messages.columnSection), formatMessage(messages.columnSubsection),
        formatMessage(messages.columnUnit), formatMessage(messages.columnPoints), formatMessage(messages.columnStatus),
      ]);
      expect(table.body[0]).toEqual(['Section 1', 'Homework 1', 'Unit 1', '2 of 2', formatMessage(messages.passed)]);
      expect(table.body[1][4]).toEqual(formatMessage(messages.notPassed));
      const cell = (row, column) => {
        const data = {
          section: 'body', row: { index: row }, column: { index: column }, cell: { styles: {} },
        };
        table.didParseCell(data);
        return data.cell.styles;
      };
      expect(cell(0, 4)).toEqual({ textColor: pdf.COLORS.green, fontStyle: 'bold' });
      expect(cell(1, 4)).toEqual({ textColor: pdf.COLORS.coal });
      expect(cell(0, 0)).toEqual({});
      expect(cell(1, 0)).toEqual({ textColor: pdf.COLORS.grey });
      expect(cell(1, 1)).toEqual({ textColor: pdf.COLORS.grey });
      // A new subsection shows its name in full, its section stays greyed.
      expect(cell(2, 1)).toEqual({});
      expect(cell(2, 0)).toEqual({ textColor: pdf.COLORS.grey });
      expect(cell(1, 2)).toEqual({});
    });
    test('chart: a bar per subsection, green only with all the points', () => {
      build([{ ...reports[0], progress: progress([{ name: 'S', subsections: [homework, { ...practice, earned: 1 }] }]) }]);
      const texts = doc.texts.map((t) => t.text);
      expect(texts).toContain(formatMessage(messages.chartTitle));
      expect(texts).toContain(formatMessage(messages.chartValue, { earned: '3', possible: '4', percent: '75' }));
      expect(texts).toContain(formatMessage(messages.chartValue, { earned: '1', possible: '1', percent: '100' }));
      const bars = doc.rects.filter((r) => r.fill !== pdf.COLORS.track).map((r) => r.fill);
      expect(bars).toEqual([pdf.COLORS.grey, pdf.COLORS.green]);
    });
    test('a learner without scored units gets a note instead of the table', () => {
      build([{ ...reports[0], progress: progress([], { units: 0, passedUnits: 0 }) }]);
      expect(doc.tables).toBeUndefined();
      expect(doc.texts.map((t) => t.text)).toContain(formatMessage(messages.nothingScored));
    });
    test('footers: course, learner of the page, page numbers', () => {
      build(reports);
      const footers = doc.texts.filter((t) => t.text.startsWith('Robots'));
      expect(footers.map((t) => [t.text, t.page])).toEqual([
        ['Robots  ·  Анна Смирнова', 1], ['Robots  ·  Борис Петров', 2],
      ]);
      expect(doc.texts.map((t) => t.text)).toContain(formatMessage(messages.page, { page: 2, pages: 2 }));
    });
  });
});
