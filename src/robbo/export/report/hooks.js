/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 */
/* eslint-disable import/no-self-import */
import React from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';

import { selectors } from 'data/redux/hooks';
import useCourseName from 'robbo/useCourseName';

import { downloadFile, exportFileName } from '../data';
import { fetchLearners, fetchProgress } from './api';
import { buildReport, loadPdfTools } from './pdf';
import messages from './messages';
import * as module from './hooks';

export const statuses = {
  idle: 'idle',
  loading: 'loading',
  loaded: 'loaded',
  failed: 'failed',
};

// useState behind an object, so that tests can mock it (testUtils MockUseState).
export const state = {
  isOpen: (val) => React.useState(val), // eslint-disable-line
  learners: (val) => React.useState(val), // eslint-disable-line
  selected: (val) => React.useState(val), // eslint-disable-line
  search: (val) => React.useState(val), // eslint-disable-line
  generation: (val) => React.useState(val), // eslint-disable-line
};

/** Learners whose name, username or email contains the search, in the order of the list. */
export const filterLearners = (learners, search) => {
  const text = search.trim().toLowerCase();
  if (!text) {
    return learners;
  }
  return learners.filter((learner) => [learner.fullName, learner.username, learner.email]
    .some((value) => (value || '').toLowerCase().includes(text)));
};

/**
 * Progress of the picked learners, one after another (each one is a course grade on the LMS),
 * with onProgress(done) after each; the PDF tools load meanwhile.
 */
export const collectReports = async (courseId, learners, onProgress = () => {}) => {
  const tools = loadPdfTools();
  const reports = [];
  for (const learner of learners) { // eslint-disable-line no-restricted-syntax
    // eslint-disable-next-line no-await-in-loop
    const progress = await fetchProgress(courseId, learner.id);
    reports.push({ learner: progress.learner, lastActivity: learner.lastActivity, progress });
    onProgress(reports.length);
  }
  return { tools: await tools, reports };
};

/** The window of the PDF progress report: pick learners, generate, download. */
export const useProgressReport = () => {
  const { formatMessage } = useIntl();
  const courseId = selectors.app.useCourseId();
  const courseName = useCourseName(courseId);
  const [isOpen, setIsOpen] = module.state.isOpen(false);
  const [learners, setLearners] = module.state.learners({ status: statuses.idle, list: [], courseName: null });
  const [selected, setSelected] = module.state.selected([]);
  const [search, setSearch] = module.state.search('');
  const [generation, setGeneration] = module.state.generation({ status: statuses.idle, done: 0, total: 0 });
  const generating = generation.status === statuses.loading;

  const load = () => {
    setLearners({ status: statuses.loading, list: [], courseName: null });
    return fetchLearners(courseId)
      .then((loaded) => setLearners({ status: statuses.loaded, list: loaded.learners, courseName: loaded.courseName }))
      .catch(() => setLearners({ status: statuses.failed, list: [], courseName: null }));
  };

  const visible = module.filterLearners(learners.list, search);
  const visibleIds = visible.map((learner) => learner.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  const generate = () => {
    const picked = learners.list.filter((learner) => selected.includes(learner.id));
    setGeneration({ status: statuses.loading, done: 0, total: picked.length });
    return module.collectReports(
      courseId,
      picked,
      (done) => setGeneration({ status: statuses.loading, done, total: picked.length }),
    ).then(({ tools, reports }) => {
      // The name from the LMS with the learners; the header's name, the id only without both.
      const name = learners.courseName || courseName || courseId;
      const doc = buildReport(tools, { reports, courseName: name, formatMessage });
      downloadFile(doc.output('blob'), `${exportFileName(formatMessage(messages.fileTitle), name)}.pdf`, 'application/pdf');
      setGeneration({ status: statuses.idle, done: 0, total: 0 });
      setIsOpen(false);
    }).catch(() => setGeneration({ status: statuses.failed, done: 0, total: 0 }));
  };

  return {
    isOpen,
    open: () => {
      setIsOpen(true);
      if (learners.status !== statuses.loaded && learners.status !== statuses.loading) {
        load();
      }
    },
    close: () => !generating && setIsOpen(false),
    learnersStatus: learners.status,
    retry: load,
    visible,
    search,
    handleSearchChange: (event) => setSearch(event.target.value),
    selected,
    isSelected: (id) => selected.includes(id),
    toggle: (id) => () => setSelected((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])),
    allVisibleSelected,
    toggleAll: () => setSelected((ids) => (allVisibleSelected
      ? ids.filter((id) => !visibleIds.includes(id))
      : [...new Set([...ids, ...visibleIds])])),
    generation,
    generating,
    canGenerate: selected.length > 0 && !generating,
    generate,
  };
};
