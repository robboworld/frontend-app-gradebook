// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
import { createAction } from '@reduxjs/toolkit';
import * as utils from './utils';

jest.mock('@reduxjs/toolkit', () => ({
  createAction: (key, ...args) => ({ action: key, args }),
}));

describe('redux action utils', () => {
  describe('formatDateForDisplay', () => {
    // Robbo: in the interface language and the viewer's time zone (TZ=GMT in tests).
    it('returns the datetime as a formatted string', () => {
      const date = new Date('2021-06-03T15:59:00Z');
      expect(utils.formatDateForDisplay(date)).toEqual('3 июня 2021 г. в 15:59');
    });
  });
  describe('sortAlphaAsc', () => {
    it('returns sorting value (-1, 0, 1) by uppercase username', () => {
      const sort = (v1, v2) => utils.sortAlphaAsc({ username: v1 }, { username: v2 });
      expect(sort('aName', 'ANAme')).toEqual(0);
      expect(sort('aName', 'laterName')).toEqual(-1);
      expect(sort('laterName', 'aName')).toEqual(1);
    });
  });
  describe('createActionFactory', () => {
    it('returns an action creator with the data key', () => {
      const dataKey = 'part-of-the-model';
      const actionKey = 'an-action';
      const args = ['some', 'args'];
      expect(utils.createActionFactory(dataKey)(actionKey, ...args)).toEqual(
        createAction(`${dataKey}/${actionKey}`, ...args),
      );
    });
  });
});
