import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import { BrowserRouter, Route, Routes } from 'react-router';

import { PersistGate } from 'redux-persist/integration/react';
import { GamePage } from './app/game';
import { GameOver } from './app/game-over';
import { MainMenu } from './app/menu';
import { persistor, store } from './state/store';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainMenu />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/game-over" element={<GameOver />} />
          </Routes>
        </BrowserRouter>
      </PersistGate>
    </ReduxProvider>
  </StrictMode>,
);
