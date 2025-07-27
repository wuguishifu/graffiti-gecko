import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import { HashRouter, Route, Routes } from 'react-router';
import { PersistGate } from 'redux-persist/integration/react';

import { DevMenu } from './app/dev-menu';
import { GamePage } from './app/game';
import { GameOver } from './app/game-over';
import { MainMenu } from './app/menu';
import { InitialInteractionDetector } from './components/initial-interaction-detector';
import { VolumeUpdater } from './components/volume-updater';
import { persistor, store } from './state/store';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <InitialInteractionDetector />
        <VolumeUpdater />
        <HashRouter>
          <Routes>
            <Route path="/" element={<MainMenu />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/game-over" element={<GameOver />} />
            <Route path="/dev" element={<DevMenu />} />
          </Routes>
        </HashRouter>
      </PersistGate>
    </ReduxProvider>
  </StrictMode>,
);
