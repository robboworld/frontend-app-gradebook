/**
 * Copyright (C) 2026 Robbo <https://robbo.ru>
 * SPDX-License-Identifier: AGPL-3.0-only
 * Part of the Robbo Open edX MFE overrides. See NOTICE at repository root.
 */
import { selectors } from 'data/redux/hooks';
import { hasMastersTrack } from 'data/selectors/tracks';

/** True when the course has a master's track (the only case with Student Keys). */
const useHasMastersTrack = () => hasMastersTrack(selectors.tracks.useAllTracks());

export default useHasMastersTrack;
