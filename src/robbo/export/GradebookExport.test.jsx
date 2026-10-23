/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 */
import React from 'react';
import { shallow } from '@edx/react-unit-test-utils';

import { Button } from '@openedx/paragon';
import { formatMessage } from 'testUtils';

import { exportStatuses, useGradebookExport } from './hooks';
import { useProgressReport } from './report/hooks';
import ReportModal from './report/ReportModal';
import GradebookExport from './GradebookExport';
import messages from './messages';

jest.mock('./hooks', () => ({
  ...jest.requireActual('./hooks'),
  useGradebookExport: jest.fn(),
}));
jest.mock('./report/hooks', () => ({ useProgressReport: jest.fn() }));
jest.mock('./report/ReportModal', () => 'ReportModal');

const hookProps = {
  status: exportStatuses.idle,
  progress: { loaded: 0, total: 0 },
  disabled: false,
  exportCsv: jest.fn().mockName('hooks.exportCsv'),
};
const report = { open: jest.fn().mockName('report.open'), isOpen: false };
useProgressReport.mockReturnValue(report);

let el;
const render = (props = {}) => {
  useGradebookExport.mockReturnValue({ ...hookProps, ...props });
  el = shallow(<GradebookExport />);
};

describe('GradebookExport', () => {
  test('snapshot', () => {
    render();
    expect(el.snapshot).toMatchSnapshot();
  });
  test('CSV of the table, the PDF report window', () => {
    render();
    const [csv, pdf] = el.instance.findByType(Button);
    expect(csv.children[0].el).toEqual(formatMessage(messages.csv));
    expect(csv.props.onClick).toEqual(hookProps.exportCsv);
    expect(pdf.children[0].el).toEqual(formatMessage(messages.pdf));
    expect(pdf.props.onClick).toEqual(report.open);
    expect(el.instance.findByType(ReportModal)[0].props.report).toEqual(report);
    expect(el.instance.props['aria-label']).toEqual(formatMessage(messages.groupLabel));
  });
  test('progress of the CSV, its button disabled; the report stays available', () => {
    render({ status: exportStatuses.loading, progress: { loaded: 200, total: 450 }, disabled: true });
    const [csv, pdf] = el.instance.findByType(Button);
    expect(csv.props.disabled).toEqual(true);
    expect(pdf.props.disabled).toBeUndefined();
    const [status] = el.instance.findByType('span');
    expect(status.props.role).toEqual('status');
    expect(status.children[0].el).toEqual(formatMessage(messages.preparing, { loaded: 200, total: 450 }));
  });
  test('a failure is announced', () => {
    render({ status: exportStatuses.failed });
    const alert = el.instance.findByType('span').find((span) => span.props.role === 'alert');
    expect(alert.children[0].el).toEqual(formatMessage(messages.failed));
  });
});
