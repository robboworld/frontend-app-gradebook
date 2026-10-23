// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
// Robbo: dates in the language of the interface and in the viewer's time («21 октября 2026 г.
// в 14:25»), not in English and UTC. The only date formatter of the app (data/actions/utils).
// From i18n/lib (the module behind '@edx/frontend-platform/i18n'): `utils` is loaded by the test
// mock of '@edx/frontend-platform/i18n' itself (setupTest → testUtils), so importing that path
// here would be circular there.
import { getLocale } from '@edx/frontend-platform/i18n/lib';

export const DEFAULT_LOCALE = 'ru';

export const options = {
  dateStyle: 'long',
  timeStyle: 'short',
};

/** The interface language; Russian before i18n is configured (tests, early errors). */
export const displayLocale = () => {
  try {
    return getLocale() || DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
};

const formatDateForDisplay = (inputDate) => (
  new Intl.DateTimeFormat(displayLocale(), options).format(inputDate)
);

export default formatDateForDisplay;
