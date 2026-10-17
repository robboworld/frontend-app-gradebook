// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
import React from 'react';
import { shallow } from '@edx/react-unit-test-utils';

import {
  ActionRow,
  ModalDialog,
  Tab,
  Tabs,
} from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';

import { formatMessage } from 'testUtils';
import LearnerAnswers from 'robbo/answers/LearnerAnswers';
import robboMessages from 'robbo/answers/messages';

import ModalHeaders from './ModalHeaders';
import OverrideTable from './OverrideTable';
import useEditModalData, { modalTabs } from './hooks';
import EditModal from '.';
import messages from './messages';

jest.mock('./hooks', () => ({
  __esModule: true,
  default: jest.fn(),
  modalTabs: { answers: 'answers', override: 'override' },
}));
jest.mock('./ModalHeaders', () => 'ModalHeaders');
jest.mock('./OverrideTable', () => 'OverrideTable');
jest.mock('robbo/answers/LearnerAnswers', () => 'LearnerAnswers');

const hookProps = {
  onClose: jest.fn().mockName('hooks.onClose'),
  error: 'test-error',
  handleAdjustedGradeClick: jest.fn().mockName('hooks.handleAdjustedGradeClick'),
  isOpen: 'test-is-open',
  areGradesFrozen: false,
  activeTab: modalTabs.answers,
  setActiveTab: jest.fn().mockName('hooks.setActiveTab'),
};

let el;
const render = (props = {}) => {
  useEditModalData.mockReturnValue({ ...hookProps, ...props });
  el = shallow(<EditModal />);
};
const modal = () => el.instance.findByType(ModalDialog)[0];
const bodyChildren = () => modal().findByType(ModalDialog.Body)[0].children[0].children;
const footerButtons = () => modal().findByType(ActionRow)[0].children;

describe('EditModal component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('behavior', () => {
    beforeEach(() => render());
    it('initializes intl hook', () => {
      expect(useIntl).toHaveBeenCalled();
    });
    it('initializes component hooks', () => {
      expect(useEditModalData).toHaveBeenCalled();
    });
  });

  describe('answers tab', () => {
    beforeEach(() => render());
    test('snapshot', () => {
      expect(el.snapshot).toMatchSnapshot();
    });
    test('modal props', () => {
      const { props } = modal();
      expect(props.title).toEqual(formatMessage(robboMessages.modalTitle));
      expect(props.isOpen).toEqual(hookProps.isOpen);
      expect(props.onClose).toEqual(hookProps.onClose);
    });
    test('header with the title', () => {
      const title = modal().findByType(ModalDialog.Title)[0];
      expect(title.children[0].el).toEqual(formatMessage(robboMessages.modalTitle));
    });
    test('headers row above the tabs', () => {
      const children = bodyChildren();
      expect(children[0]).toMatchObject(shallow(<ModalHeaders />));
      expect(children[1].type).toEqual('Tabs');
    });
    test('tabs follow the hook state', () => {
      const tabs = modal().findByType(Tabs)[0];
      expect(tabs.props.activeKey).toEqual(modalTabs.answers);
      expect(tabs.props.onSelect).toEqual(hookProps.setActiveTab);
    });
    test('answers tab first, then the grade form', () => {
      const [answers, override] = modal().findByType(Tab);
      expect(answers.props.eventKey).toEqual(modalTabs.answers);
      expect(answers.props.title).toEqual(formatMessage(robboMessages.answersTab));
      expect(answers.children[0]).toMatchObject(shallow(<LearnerAnswers />));
      expect(override.props.eventKey).toEqual(modalTabs.override);
      expect(override.props.title).toEqual(formatMessage(robboMessages.overrideTab));
    });
    test('grade form in the second tab', () => {
      const { children } = modal().findByType(Tab)[1];
      expect(children[0].type).toEqual('Alert');
      expect(children[0].props.show).toEqual(true);
      expect(children[0].children[0].el).toEqual(hookProps.error);
      expect(children[1]).toMatchObject(shallow(<OverrideTable />));
      expect(children[2].children[0].el).toEqual(formatMessage(messages.visibility));
      expect(children[3].children[0].el).toEqual(formatMessage(messages.saveVisibility));
    });
    test('only a close button in the footer', () => {
      const buttons = footerButtons();
      expect(buttons.length).toEqual(1);
      expect(buttons[0].type).toEqual('ModalDialog.CloseButton');
      expect(buttons[0].children[0].el).toEqual(formatMessage(robboMessages.close));
    });
  });

  describe('grade form tab', () => {
    beforeEach(() => render({ activeTab: modalTabs.override }));
    test('snapshot', () => {
      expect(el.snapshot).toMatchSnapshot();
    });
    test('cancel button', () => {
      const button = footerButtons()[0];
      expect(button.type).toEqual('ModalDialog.CloseButton');
      expect(button.children[0].el).toEqual(formatMessage(messages.closeText));
    });
    test('save button', () => {
      const button = footerButtons()[1];
      expect(button.type).toEqual('Button');
      expect(button.children[0].el).toEqual(formatMessage(messages.saveGrade));
      expect(button.props.onClick).toEqual(hookProps.handleAdjustedGradeClick);
    });
    test('alert hidden without an error', () => {
      render({ activeTab: modalTabs.override, error: undefined });
      const alert = modal().findByType(Tab)[1].children[0];
      expect(alert.type).toEqual('Alert');
      expect(alert.props.show).toEqual(false);
    });
  });

  describe('frozen grades', () => {
    beforeEach(() => render({ areGradesFrozen: true, activeTab: modalTabs.override }));
    test('snapshot', () => {
      expect(el.snapshot).toMatchSnapshot();
    });
    test('answers title', () => {
      expect(modal().props.title).toEqual(formatMessage(robboMessages.answersTitle));
    });
    test('answers only, no tabs', () => {
      expect(modal().findByType(Tabs)).toEqual([]);
      const answers = bodyChildren()[1];
      expect(answers.props.className).toEqual('robbo-grade-modal__answers-only');
      expect(answers.children[0]).toMatchObject(shallow(<LearnerAnswers />));
    });
    test('only a close button in the footer', () => {
      const buttons = footerButtons();
      expect(buttons.length).toEqual(1);
      expect(buttons[0].children[0].el).toEqual(formatMessage(robboMessages.close));
    });
  });
});
