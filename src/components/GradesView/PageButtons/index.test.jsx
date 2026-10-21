// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
import React from 'react';
import { shallow } from '@edx/react-unit-test-utils';

import { Button } from '@openedx/paragon';

import usePageButtonsData from './hooks';
import PageButtons from '.';

jest.mock('./hooks', () => jest.fn());

const hookProps = {
  prev: {
    disabled: false,
    onClick: jest.fn().mockName('hooks.prev.onClick'),
    text: 'prev-text',
  },
  next: {
    disabled: true,
    onClick: jest.fn().mockName('hooks.next.onClick'),
    text: 'next-text',
  },
};
usePageButtonsData.mockReturnValue(hookProps);

let el;
describe('PageButtons component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    el = shallow(<PageButtons />);
  });
  describe('behavior', () => {
    it('initializes component hooks', () => {
      expect(usePageButtonsData).toHaveBeenCalled();
    });
  });
  describe('render', () => {
    test('snapshot', () => {
      expect(el.snapshot).toMatchSnapshot();
    });
    test('prev button', () => {
      const button = el.instance.findByType(Button)[0];
      expect(button.props.disabled).toEqual(hookProps.prev.disabled);
      expect(button.props.onClick).toEqual(hookProps.prev.onClick);
      expect(button.children[0].el).toEqual(hookProps.prev.text);
    });
    test('next button', () => {
      const button = el.instance.findByType(Button)[1];
      expect(button.props.disabled).toEqual(hookProps.next.disabled);
      expect(button.props.onClick).toEqual(hookProps.next.onClick);
      expect(button.children[0].el).toEqual(hookProps.next.text);
    });
    test('nothing while all learners fit on one page', () => {
      usePageButtonsData.mockReturnValueOnce({
        prev: { ...hookProps.prev, disabled: true },
        next: hookProps.next,
      });
      el = shallow(<PageButtons />);
      expect(el.isEmptyRender()).toEqual(true);
    });
  });
});
