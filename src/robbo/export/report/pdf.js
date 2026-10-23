/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 *
 * The PDF progress report: one learner after another in alphabetical order, each from a new page:
 * name and summary, a table section → subsection → unit with the points and the status of the
 * unit (passed with all of its points only), then a bar chart of the points by subsection.
 * jsPDF and the Cyrillic font (DejaVu Sans, fonts/LICENSE-DejaVu.txt) load only when a report is
 * made, so the gradebook itself does not grow.
 */
import selectors from 'data/selectors';
import formatDateForDisplay, { displayLocale } from 'utils/formatDate';

import { cellText } from '../data';
import regularFontUrl from '../fonts/DejaVuSans.ttf';
import boldFontUrl from '../fonts/DejaVuSans-Bold.ttf';
import messages from './messages';

export const FONT = 'DejaVuSans';

// docs/design/robbo-brand-guidelines.md: brand green, coal and grey; the light green of the app.
export const COLORS = {
  green: '#00af41',
  coal: '#383838',
  grey: '#989898',
  lightGreen: '#e8f8ef',
  rule: '#cfd8d3',
  track: '#eeeeee',
};

// A4 portrait, millimetres.
export const PAGE = {
  margin: 15,
  footer: 8,
};

const CHART = {
  label: 62,
  value: 34,
  row: 7,
  bar: 4.2,
  title: 10,
};

/** Name used in the report and for the alphabetical order. */
export const learnerName = (learner) => learner.fullName || learner.username;

/** Reports in alphabetical order of the learners (Russian collation). */
export const sortReports = (reports, locale = displayLocale()) => (
  [...reports].sort((a, b) => learnerName(a.learner).localeCompare(learnerName(b.learner), locale))
);

const percentOf = (earned, possible) => (possible ? selectors.grades.roundGrade((earned / possible) * 100) : 0);

/** Rows of the table: every unit with its section and subsection, in outline order. */
export const tableRows = (progress, formatMessage, locale = displayLocale()) => progress.sections.flatMap(
  (section) => section.subsections.flatMap((subsection) => subsection.units.map((unit) => ({
    section: section.name,
    subsection: subsection.graded ? subsection.name : formatMessage(messages.ungraded, { name: subsection.name }),
    unit: unit.name,
    points: formatMessage(messages.points, {
      earned: cellText(unit.earned, locale), possible: cellText(unit.possible, locale),
    }),
    passed: unit.passed,
  }))),
);

/** Bars of the chart: one per subsection, with its own total (the one of the gradebook). */
export const chartBars = (progress) => progress.sections.flatMap((section) => section.subsections.map((subsection) => ({
  label: subsection.name,
  earned: subsection.earned,
  possible: subsection.possible,
  percent: percentOf(subsection.earned, subsection.possible),
})));

const toBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
};

const loadFont = (url) => fetch(url).then((response) => {
  if (!response.ok) {
    throw new Error(`Font ${url}: ${response.status}`);
  }
  return response.arrayBuffer();
}).then(toBase64);

/** jsPDF with autoTable and the Cyrillic font, loaded on first use. */
export const loadPdfTools = async () => {
  const [{ jsPDF: JsPdf }, { autoTable }, regular, bold] = await Promise.all([
    import(/* webpackChunkName: "robbo-report-pdf" */ 'jspdf'),
    import(/* webpackChunkName: "robbo-report-pdf" */ 'jspdf-autotable'),
    loadFont(regularFontUrl),
    loadFont(boldFontUrl),
  ]);
  return { JsPdf, autoTable, fonts: { regular, bold } };
};

const newDocument = ({ JsPdf, fonts }) => {
  const doc = new JsPdf({ unit: 'mm', format: 'a4', compress: true });
  doc.addFileToVFS(`${FONT}.ttf`, fonts.regular);
  doc.addFont(`${FONT}.ttf`, FONT, 'normal');
  doc.addFileToVFS(`${FONT}-Bold.ttf`, fonts.bold);
  doc.addFont(`${FONT}-Bold.ttf`, FONT, 'bold');
  doc.setFont(FONT, 'normal');
  return doc;
};

const contentWidth = (doc) => doc.internal.pageSize.getWidth() - PAGE.margin * 2;
const bottomLimit = (doc) => doc.internal.pageSize.getHeight() - PAGE.margin - PAGE.footer;

const writeLines = (doc, text, y, { size = 10, style = 'normal', color = COLORS.coal } = {}) => {
  doc.setFont(FONT, style);
  doc.setFontSize(size);
  doc.setTextColor(color);
  const lines = doc.splitTextToSize(text, contentWidth(doc));
  doc.text(lines, PAGE.margin, y, { baseline: 'top' });
  return y + lines.length * size * 0.42 + 1.5;
};

/** Name, contacts, course, summary; returns where the table starts. */
const drawHeader = (doc, {
  report, courseName, formatMessage, locale,
}) => {
  const { learner, progress } = report;
  let y = PAGE.margin;
  y = writeLines(doc, learnerName(learner), y, { size: 16, style: 'bold' });
  const contacts = [formatMessage(messages.username, { username: learner.username })];
  if (learner.email) {
    contacts.push(formatMessage(messages.email, { email: learner.email }));
  }
  y = writeLines(doc, contacts.join('   ·   '), y, { size: 9, color: COLORS.grey });
  y = writeLines(doc, formatMessage(messages.course, { name: courseName }), y, { size: 9, color: COLORS.grey });
  y = writeLines(doc, report.lastActivity
    ? formatMessage(messages.lastActivity, { date: formatDateForDisplay(new Date(report.lastActivity)) })
    : formatMessage(messages.noActivity), y, { size: 9, color: COLORS.grey });
  y += 1.5;
  y = writeLines(doc, formatMessage(messages.summary, {
    percent: cellText(selectors.grades.roundGrade(progress.percent * 100), locale),
    passed: progress.passedUnits,
    total: progress.units,
  }), y, { size: 11, style: 'bold' });
  return y + 2;
};

/** Section → subsection → unit table; a name repeated from the row above is greyed. */
const drawTable = (doc, autoTable, { rows, formatMessage, startY }) => {
  const columns = ['section', 'subsection', 'unit', 'points', 'status'];
  autoTable(doc, {
    startY,
    margin: { left: PAGE.margin, right: PAGE.margin, bottom: PAGE.margin + PAGE.footer },
    theme: 'grid',
    showHead: 'everyPage',
    head: [[
      formatMessage(messages.columnSection),
      formatMessage(messages.columnSubsection),
      formatMessage(messages.columnUnit),
      formatMessage(messages.columnPoints),
      formatMessage(messages.columnStatus),
    ]],
    body: rows.map((row) => [
      row.section,
      row.subsection,
      row.unit,
      row.points,
      formatMessage(row.passed ? messages.passed : messages.notPassed),
    ]),
    styles: {
      font: FONT, fontSize: 8.5, textColor: COLORS.coal, lineColor: COLORS.rule, lineWidth: 0.2, cellPadding: 1.6,
    },
    headStyles: {
      font: FONT, fontStyle: 'bold', fillColor: COLORS.lightGreen, textColor: COLORS.coal,
    },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 44 },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 26 },
    },
    didParseCell: (data) => {
      if (data.section !== 'body') {
        return;
      }
      const row = rows[data.row.index];
      const previous = rows[data.row.index - 1];
      const column = columns[data.column.index];
      if (column === 'status') {
        Object.assign(data.cell.styles, row.passed
          ? { textColor: COLORS.green, fontStyle: 'bold' }
          : { textColor: COLORS.coal });
      } else if (previous && (column === 'section' || column === 'subsection')
        && row.section === previous.section && (column === 'section' || row.subsection === previous.subsection)) {
        // autoTable styles a cell through the hook's data.
        Object.assign(data.cell.styles, { textColor: COLORS.grey });
      }
    },
  });
  return doc.lastAutoTable.finalY;
};

/** Horizontal bars, 0–100 % of each subsection's points; green when all points are there. */
const drawChart = (doc, {
  bars, formatMessage, locale, startY,
}) => {
  const width = contentWidth(doc);
  const barX = PAGE.margin + CHART.label;
  const barWidth = width - CHART.label - CHART.value;
  let y = startY + 8;
  // Keep the title with at least two bars.
  if (y + CHART.title + CHART.row * Math.min(bars.length, 2) > bottomLimit(doc)) {
    doc.addPage();
    y = PAGE.margin;
  }
  y = writeLines(doc, formatMessage(messages.chartTitle), y, { size: 12, style: 'bold' }) + 1;
  bars.forEach((bar) => {
    if (y + CHART.row > bottomLimit(doc)) {
      doc.addPage();
      y = PAGE.margin;
    }
    doc.setFont(FONT, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.coal);
    // A long subsection name keeps its first line, with an ellipsis.
    const lines = doc.splitTextToSize(bar.label, CHART.label - 4);
    const shown = lines.length > 1 ? `${lines[0].trimEnd()}…` : lines[0];
    doc.text(shown, PAGE.margin, y + CHART.row / 2, { baseline: 'middle' });
    const barY = y + (CHART.row - CHART.bar) / 2;
    doc.setFillColor(COLORS.track);
    doc.rect(barX, barY, barWidth, CHART.bar, 'F');
    if (bar.percent > 0) {
      doc.setFillColor(bar.percent >= 100 ? COLORS.green : COLORS.grey);
      doc.rect(barX, barY, (barWidth * Math.min(bar.percent, 100)) / 100, CHART.bar, 'F');
    }
    doc.setTextColor(bar.percent >= 100 ? COLORS.green : COLORS.coal);
    doc.text(formatMessage(messages.chartValue, {
      earned: cellText(bar.earned, locale),
      possible: cellText(bar.possible, locale),
      percent: cellText(bar.percent, locale),
    }), PAGE.margin + width, y + CHART.row / 2, { baseline: 'middle', align: 'right' });
    y += CHART.row;
  });
  // Scale under the bars.
  doc.setDrawColor(COLORS.rule);
  doc.setLineWidth(0.2);
  doc.setFontSize(7);
  doc.setTextColor(COLORS.grey);
  [0, 50, 100].forEach((mark) => {
    const x = barX + (barWidth * mark) / 100;
    doc.line(x, y, x, y + 1.5);
    doc.text(`${mark} %`, x, y + 2, { baseline: 'top', align: 'center' });
  });
};

/** Footers once the pages are known: course and learner on the left, page numbers on the right. */
const drawFooters = (doc, { courseName, pageLearners, formatMessage }) => {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    const y = doc.internal.pageSize.getHeight() - PAGE.margin + 2;
    doc.setFont(FONT, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(COLORS.grey);
    const left = [courseName, pageLearners[page]].filter(Boolean).join('  ·  ');
    doc.text(doc.splitTextToSize(left, contentWidth(doc) - 30)[0], PAGE.margin, y);
    doc.text(formatMessage(messages.page, { page, pages }), PAGE.margin + contentWidth(doc), y, { align: 'right' });
  }
};

/**
 * The report of these learners as a jsPDF document.
 * @param {object} tools - loadPdfTools() result
 * @param {object[]} reports - [{ learner, lastActivity, progress }] (progress: the LMS answer)
 */
export const buildReport = (tools, {
  reports, courseName, formatMessage, locale = displayLocale(),
}) => {
  const doc = newDocument(tools);
  const pageLearners = {};
  sortReports(reports, locale).forEach((report, index) => {
    if (index > 0) {
      doc.addPage();
    }
    const firstPage = doc.getNumberOfPages();
    const startY = drawHeader(doc, {
      report, courseName, formatMessage, locale,
    });
    const rows = tableRows(report.progress, formatMessage, locale);
    if (rows.length) {
      const tableEnd = drawTable(doc, tools.autoTable, { rows, formatMessage, startY });
      drawChart(doc, {
        bars: chartBars(report.progress), formatMessage, locale, startY: tableEnd,
      });
    } else {
      writeLines(doc, formatMessage(messages.nothingScored), startY, { color: COLORS.grey });
    }
    for (let page = firstPage; page <= doc.getNumberOfPages(); page += 1) {
      pageLearners[page] = learnerName(report.learner);
    }
  });
  drawFooters(doc, { courseName, pageLearners, formatMessage });
  return doc;
};
