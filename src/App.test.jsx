import React from 'react';
import { shallow } from '@edx/react-unit-test-utils';

import { Route } from 'react-router-dom';

import store from 'data/store';
import GradebookPage from 'containers/GradebookPage';

import App from './App';

jest.mock('react-router-dom', () => ({
  BrowserRouter: () => 'BrowserRouter',
  Route: () => 'Route',
  Routes: () => 'Routes',
}));
jest.mock('@edx/frontend-platform/react', () => ({
  AppProvider: () => 'AppProvider',
}));
jest.mock('@edx/frontend-component-footer', () => ({ FooterSlot: 'FooterSlot' }));
jest.mock('data/store', () => 'testStore');
jest.mock('containers/GradebookPage', () => 'GradebookPage');
jest.mock('@edx/frontend-component-header', () => 'Header');
jest.mock('./head/Head', () => 'Head');
jest.mock('./robbo-errors', () => ({ RobboErrorBoundary: 'RobboErrorBoundary' }));

let el;
let secondChild;

describe('App router component', () => {
  test('snapshot', () => {
    expect(shallow(<App />).snapshot).toMatchSnapshot();
  });
  describe('component', () => {
    beforeEach(() => {
      el = shallow(<App />);
      // Robbo: the app inside AppProvider is wrapped in RobboErrorBoundary (src/robbo-errors).
      secondChild = el.instance.children[0].children;
    });
    describe('AppProvider', () => {
      test('AppProvider is the parent component, passed the redux store props', () => {
        expect(el.instance.type).toBe('AppProvider');
        expect(el.instance.props.store).toEqual(store);
      });
    });
    describe('RobboErrorBoundary', () => {
      test('only child of AppProvider', () => {
        expect(el.instance.children).toHaveLength(1);
        expect(el.instance.children[0].type).toBe('RobboErrorBoundary');
      });
    });
    describe('Head', () => {
      test('first child inside RobboErrorBoundary', () => {
        expect(secondChild[0].type).toBe('Head');
      });
    });
    describe('Router', () => {
      test('second child inside RobboErrorBoundary', () => {
        expect(secondChild[1].type).toBe('div');
      });
      test('Header is above/outside-of the routing', () => {
        expect(secondChild[1].children[0].type).toBe('Header');
        expect(secondChild[1].children[1].type).toBe('main');
      });
      test('Routing - GradebookPage is only route', () => {
        expect(secondChild[1].findByType(Route)).toHaveLength(1);
        expect(secondChild[1].findByType(Route)[0].props.path).toEqual('/:courseId');
        expect(secondChild[1].findByType(Route)[0].props.element.type).toEqual(GradebookPage);
      });
    });
  });
});
