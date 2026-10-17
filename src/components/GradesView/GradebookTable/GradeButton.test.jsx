// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
import React from 'react';
import { shallow } from '@edx/react-unit-test-utils';

import { selectors, thunkActions } from 'data/redux/hooks';
import transforms from 'data/redux/transforms';
import { keyStore } from 'utils';

import * as module from './GradeButton';

const { useGradeButtonData, default: GradeButton } = module;

jest.mock('data/redux/hooks', () => ({
  selectors: {
    grades: {
      useGradeData: jest.fn(),
    },
  },
  thunkActions: {
    app: { useSetModalStateFromTable: jest.fn() },
  },
}));
jest.mock('data/redux/transforms', () => ({
  grades: {
    subsectionGrade: jest.fn(),
  },
}));

const props = {
  subsection: {
    attempted: false,
    percent: 23,
    score_possible: 32,
    subsection_name: 'the things we do',
    module_id: 'in potions',
  },
  entry: {
    user_id: 2,
    username: 'Jessie',
  },
};
const gradeFormat = 'percent';
const setModalState = jest.fn();
const subsectionGrade = () => 'test-subsection-grade';
selectors.grades.useGradeData.mockReturnValue({ gradeFormat });
thunkActions.app.useSetModalStateFromTable.mockReturnValue(setModalState);
transforms.grades.subsectionGrade.mockReturnValue(subsectionGrade);

let el;
let out;
describe('GradeButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('useGradeButton hook', () => {
    beforeEach(() => {
      out = useGradeButtonData(props);
    });
    describe('behavior', () => {
      it('initializes redux hooks', () => {
        expect(selectors.grades.useGradeData).toHaveBeenCalled();
        expect(transforms.grades.subsectionGrade).toHaveBeenCalledWith({
          gradeFormat,
          subsection: props.subsection,
        });
        expect(thunkActions.app.useSetModalStateFromTable).toHaveBeenCalled();
      });
    });
    describe('output', () => {
      test('label passed from subsection grade redux hook', () => {
        expect(out.label).toEqual(subsectionGrade());
      });
      test('onClick sets modal state with user entry and subsection', () => {
        out.onClick();
        expect(setModalState).toHaveBeenCalledWith({
          userEntry: props.entry,
          subsection: props.subsection,
        });
      });
    });
  });
  describe('component', () => {
    let hookSpy;
    const moduleKeys = keyStore(module);
    const hookProps = {
      label: 'test-label',
      onClick: jest.fn().mockName('hooks.onClick'),
    };
    beforeEach(() => {
      hookSpy = jest.spyOn(module, moduleKeys.useGradeButtonData);
    });
    // Robbo: frozen grades keep the button too: the modal then shows only the learner's answers.
    describe('button', () => {
      beforeEach(() => {
        hookSpy.mockReturnValue(hookProps);
        el = shallow(<GradeButton {...props} />);
      });
      test('snapshot', () => {
        expect(el.snapshot).toMatchSnapshot();
        expect(el.instance.type).toEqual('Button');
        expect(el.instance.props.onClick).toEqual(hookProps.onClick);
        expect(el.instance.children[0].el).toEqual(hookProps.label);
      });
    });
  });
});
