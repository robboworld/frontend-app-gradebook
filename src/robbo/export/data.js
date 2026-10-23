/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 *
 * Export of the gradebook table: every learner of the current filters and search (all pages,
 * not only the one on screen), the columns and grade format of the table, as CSV for Excel
 * (semicolons, decimal commas in Russian, BOM). The PDF is the progress report (report/).
 */
import { sortAlphaAsc } from 'data/actions/utils';
import { Headings } from 'data/constants/grades';
import selectors from 'data/selectors';
import lms from 'data/services/lms';
import { get } from 'data/services/lms/utils';
import tableMessages from 'components/GradesView/GradebookTable/messages';
import { displayLocale } from 'utils/formatDate';

// The API has no upper limit; 200 learners keep each request short.
export const EXPORT_PAGE_SIZE = 200;

/** Everything the export needs from the redux state at the moment of the click. */
export const exportSubject = (state) => {
  const { searchText, ...options } = selectors.root.localFilters(state);
  return {
    courseId: selectors.app.courseId(state),
    headings: selectors.root.getHeadings(state),
    gradeFormat: selectors.grades.gradeFormat(state),
    searchText: searchText || null,
    cohort: selectors.filters.cohort(state),
    track: selectors.filters.track(state),
    options,
  };
};

/** All learners of the filters, page after page; onProgress(loaded, total) after each page. */
export const fetchAllGrades = async (subject, onProgress = () => {}) => {
  let { data } = await lms.api.fetch.gradebookData(
    subject.searchText,
    subject.cohort,
    subject.track,
    { ...subject.options, pageSize: EXPORT_PAGE_SIZE },
  );
  const results = [...data.results];
  onProgress(results.length, data.filtered_users_count);
  while (data.next) {
    // Pages come one after another: each one carries the cursor of the next.
    ({ data } = await get(data.next)); // eslint-disable-line no-await-in-loop
    results.push(...data.results);
    onProgress(results.length, data.filtered_users_count);
  }
  return results.sort(sortAlphaAsc);
};

const headingMessages = {
  [Headings.username]: tableMessages.usernameHeading,
  [Headings.fullName]: tableMessages.fullNameHeading,
  [Headings.email]: tableMessages.emailHeading,
  [Headings.totalGrade]: tableMessages.totalGradeHeading,
};

/** Column titles: the table's own for the learner columns, the assignment labels as they are. */
export const exportColumns = (headings, formatMessage) => headings.map((heading) => (
  headingMessages[heading] ? formatMessage(headingMessages[heading]) : heading
));

/** One learner as the table shows them: numbers stay numbers, «2/7» stays text. */
export const exportRow = (entry, headings, gradeFormat) => {
  const subsections = Object.fromEntries(entry.section_breakdown.map((subsection) => [subsection.label, subsection]));
  return headings.map((heading) => {
    switch (heading) {
      case Headings.username: return entry.username;
      case Headings.fullName: return entry.full_name || '';
      case Headings.email: return entry.email || '';
      case Headings.totalGrade: return selectors.grades.roundGrade(entry.percent * 100);
      default: {
        const subsection = subsections[heading];
        return subsection ? selectors.grades.subsectionGrade[gradeFormat](subsection) : '';
      }
    }
  });
};

const numberText = (value, locale) => (
  new Intl.NumberFormat(locale, { maximumFractionDigits: 2, useGrouping: false }).format(value)
);

/** A cell as text in the language of the interface (9,52 in Russian). */
export const cellText = (value, locale = displayLocale()) => (
  typeof value === 'number' ? numberText(value, locale) : String(value ?? '')
);

// Text that Excel would run as a formula (a learner's name can start with «=»).
const FORMULA_START = /^[=+\-@\t\r]/;

const csvCell = (value, locale) => {
  let text = cellText(value, locale);
  if (typeof value !== 'number' && FORMULA_START.test(text)) {
    text = `'${text}`;
  }
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** CSV for Excel: BOM (so Excel reads UTF-8), semicolons (Russian Excel's list separator). */
export const toCsv = (columns, rows, locale = displayLocale()) => {
  const lines = [columns, ...rows].map((row) => row.map((value) => csvCell(value, locale)).join(';'));
  return `\uFEFF${lines.join('\r\n')}\r\n`;
};

/** «Журнал оценок – Робототехника – 2026-10-21» (en dashes) without characters file systems refuse. */
export const exportFileName = (title, courseName, date = new Date()) => {
  const day = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, '0')).join('-');
  return [title, courseName, day].filter(Boolean).join(' – ')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/** Hands a file to the browser's downloads. */
export const downloadFile = (content, fileName, type) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
