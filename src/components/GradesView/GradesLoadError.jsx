/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 *
 * The grades table failed to load: say so with the code and number (src/robbo-errors) and offer to
 * reload. Before, the spinner just stopped over an empty table.
 */
import React from 'react';
import { useSelector } from 'react-redux';

import { Button } from '@openedx/paragon';

import { RobboErrorNotice, uiText } from 'robbo-errors';

const GradesLoadError = () => {
  const info = useSelector((state) => state.grades.fetchError);
  if (!info) {
    return null;
  }
  return (
    <RobboErrorNotice
      info={info}
      actions={[
        <Button key="reload" onClick={() => window.location.reload()}>{uiText('reload')}</Button>,
      ]}
    />
  );
};

export default GradesLoadError;
