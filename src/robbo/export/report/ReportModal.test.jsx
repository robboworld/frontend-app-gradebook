/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 */
import React from 'react';
import { shallow } from '@edx/react-unit-test-utils';

import {
  Alert, Button, Form, ModalDialog, Spinner,
} from '@openedx/paragon';
import { formatMessage } from 'testUtils';

import { statuses } from './hooks';
import ReportModal, { LearnerList, LearnerOption } from './ReportModal';
import messages from './messages';

const anna = {
  id: 1, username: 'anna', fullName: 'Анна Смирнова', email: 'anna@example.com', lastActivity: '2026-10-20T16:05:00Z',
};
const zoe = {
  id: 3, username: 'zoe', fullName: '', email: '', lastActivity: null,
};
const report = {
  isOpen: true,
  close: jest.fn().mockName('report.close'),
  learnersStatus: statuses.loaded,
  retry: jest.fn().mockName('report.retry'),
  visible: [anna, zoe],
  search: '',
  handleSearchChange: jest.fn().mockName('report.handleSearchChange'),
  selected: [1],
  isSelected: (id) => id === 1,
  toggle: (id) => `toggle-${id}`,
  allVisibleSelected: false,
  toggleAll: jest.fn().mockName('report.toggleAll'),
  generation: { status: statuses.idle, done: 0, total: 0 },
  generating: false,
  canGenerate: true,
  generate: jest.fn().mockName('report.generate'),
};

describe('ReportModal', () => {
  test('snapshot', () => {
    expect(shallow(<ReportModal report={report} />).snapshot).toMatchSnapshot();
  });
  test('window, count of the picked learners, buttons', () => {
    const el = shallow(<ReportModal report={report} />);
    const modal = el.instance.findByType(ModalDialog)[0];
    expect(modal.props).toMatchObject({ isOpen: true, onClose: report.close, hasCloseButton: true });
    const status = el.instance.findByType('span').find((span) => span.props.role === 'status');
    expect(status.children[0].el).toEqual(formatMessage(messages.selected, { count: 1 }));
    const [cancel, generate] = el.instance.findByType(Button);
    expect(cancel.props.onClick).toEqual(report.close);
    expect(generate.props.onClick).toEqual(report.generate);
    expect(generate.props.disabled).toEqual(false);
    expect(generate.children[0].el).toEqual(formatMessage(messages.generate));
  });
  test('while the report is made: progress, no closing, no second click', () => {
    const el = shallow(<ReportModal report={{
      ...report, generating: true, canGenerate: false, generation: { status: statuses.loading, done: 1, total: 3 },
    }}
    />);
    expect(el.instance.findByType(ModalDialog)[0].props.hasCloseButton).toEqual(false);
    const status = el.instance.findByType('span').find((span) => span.props.role === 'status');
    expect(status.children[0].el).toEqual(
      formatMessage(messages.generating, { status: statuses.loading, done: 1, total: 3 }),
    );
    el.instance.findByType(Button).forEach((button) => expect(button.props.disabled).toEqual(true));
  });
  test('a failed report', () => {
    const failed = { ...report, generation: { status: statuses.failed, done: 0, total: 0 } };
    const el = shallow(<ReportModal report={failed} />);
    const alert = el.instance.findByType('span').find((span) => span.props.role === 'alert');
    expect(alert.children[0].el).toEqual(formatMessage(messages.generateError));
  });
});

describe('LearnerList', () => {
  test('spinner while loading', () => {
    const el = shallow(<LearnerList report={{ ...report, learnersStatus: statuses.loading }} />);
    expect(el.instance.findByType(Spinner)[0].props.screenReaderText).toEqual(formatMessage(messages.loading));
  });
  test('error with retry', () => {
    const el = shallow(<LearnerList report={{ ...report, learnersStatus: statuses.failed }} />);
    const [alert] = el.instance.findByType(Alert);
    expect(alert.children[0].el).toEqual(formatMessage(messages.loadError));
    expect(alert.props.actions[0].props.onClick).toEqual(report.retry);
  });
  test('search, select all, learners', () => {
    const el = shallow(<LearnerList report={report} />);
    const [search] = el.instance.findByType(Form.Control);
    expect(search.props).toMatchObject({ value: '', onChange: report.handleSearchChange });
    expect(search.props['aria-label']).toEqual(formatMessage(messages.search));
    const [selectAll] = el.instance.findByType(Form.Checkbox);
    expect(selectAll.props.onChange).toEqual(report.toggleAll);
    expect(selectAll.children[0].el).toEqual(formatMessage(messages.selectAll, { count: 2 }));
    const options = el.instance.findByType(LearnerOption);
    expect(options.map((option) => [option.props.learner, option.props.checked, option.props.onChange]))
      .toEqual([[anna, true, 'toggle-1'], [zoe, false, 'toggle-3']]);
  });
  test('nobody found', () => {
    const el = shallow(<LearnerList report={{ ...report, visible: [] }} />);
    expect(el.instance.findByType('p')[0].children[0].el).toEqual(formatMessage(messages.noLearners));
    expect(el.instance.findByType(LearnerOption)).toEqual([]);
  });
});

describe('LearnerOption', () => {
  const text = (el, className) => el.instance.findByType('span')
    .find((span) => span.props.className === className).children.map((child) => child.el).join('');
  test('name, username and email, last activity', () => {
    const el = shallow(<LearnerOption learner={anna} checked onChange={jest.fn()} />);
    expect(text(el, 'robbo-report__name')).toEqual('Анна Смирнова');
    expect(text(el, 'robbo-report__meta')).toEqual('anna · anna@example.com');
    expect(text(el, 'robbo-report__activity')).toEqual(
      formatMessage(messages.lastActivity, { date: '20 октября 2026 г. в 16:05' }),
    );
  });
  test('username only; never active', () => {
    const el = shallow(<LearnerOption learner={zoe} checked={false} onChange={jest.fn()} />);
    expect(text(el, 'robbo-report__name')).toEqual('zoe');
    expect(text(el, 'robbo-report__meta')).toEqual('');
    expect(text(el, 'robbo-report__activity')).toEqual(formatMessage(messages.noActivity));
  });
});
