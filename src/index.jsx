import 'core-js/stable';
import 'regenerator-runtime/runtime';

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import {
  APP_INIT_ERROR,
  APP_READY,
  initialize,
  mergeConfig,
  subscribe,
} from '@edx/frontend-platform';

import lightning from './lightning';

import messages from './i18n';
import { initRobboErrors, RobboErrorPage, robboErrorsMiddleware } from './robbo-errors';
import App from './App';

// Robbo: human-readable errors with a code and number (src/robbo-errors).
initRobboErrors({ app: 'gradebook', audience: 'staff' });

subscribe(APP_READY, () => {
  lightning();

  const root = createRoot(document.getElementById('root'));

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});

// PubSub calls back with (topic, data): the error is the second argument.
subscribe(APP_INIT_ERROR, (message, error) => {
  const root = createRoot(document.getElementById('root'));

  root.render(
    <StrictMode>
      <RobboErrorPage error={error} startup />
    </StrictMode>,
  );
});

initialize({
  authMiddleware: [robboErrorsMiddleware],
  handlers: {
    config: () => {
      mergeConfig({
        BASE_URL: process.env.BASE_URL,
        LMS_BASE_URL: process.env.LMS_BASE_URL,
        LOGIN_URL: process.env.LOGIN_URL,
        LOGOUT_URL: process.env.LOGOUT_URL,
        CSRF_TOKEN_API_PATH: process.env.CSRF_TOKEN_API_PATH,
        REFRESH_ACCESS_TOKEN_ENDPOINT: process.env.REFRESH_ACCESS_TOKEN_ENDPOINT,
        DATA_API_BASE_URL: process.env.DATA_API_BASE_URL,
        SECURE_COOKIES: process.env.NODE_ENV !== 'development',
        SEGMENT_KEY: process.env.SEGMENT_KEY,
        ACCESS_TOKEN_COOKIE_NAME: process.env.ACCESS_TOKEN_COOKIE_NAME,
      });
    },
  },
  messages,
  requireAuthenticatedUser: true,
});
