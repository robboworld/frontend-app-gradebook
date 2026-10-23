// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { AppProvider } from '@edx/frontend-platform/react';

import store from 'data/store';
import GradebookPage from 'containers/GradebookPage';
import './App.scss';
import Head from './head/Head';
import { RobboErrorBoundary } from './robbo-errors';
import { RobboHeader } from './robbo-layout';

const App = () => (
  <AppProvider store={store}>
    <RobboErrorBoundary>
      <Head />
      {/* Robbo: the site header of the other ROBBO pages (src/robbo-layout, as in profile);
          no footer — the gradebook is a working page of the course team. */}
      <div className="robbo-layout-page">
        <RobboHeader collapseNavIntoUserMenuOnNarrow />
        <main>
          <Routes>
            <Route
              path="/:courseId"
              element={<GradebookPage />}
            />
          </Routes>
        </main>
      </div>
    </RobboErrorBoundary>
  </AppProvider>
);

export default App;
