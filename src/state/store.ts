import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { type PersistConfig, persistReducer } from 'redux-persist';
import persistStore from 'redux-persist/es/persistStore';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';

import { dataSlice } from './data-slice';
import { devSlice } from './dev-slice';
import { gameSlice } from './game-slice';
import { reduxLocalStorage } from './local-storage';

const rootReducer = combineReducers({
  [gameSlice.name]: gameSlice.reducer,
  [dataSlice.name]: dataSlice.reducer,
  [devSlice.name]: devSlice.reducer,
});

const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  storage: reduxLocalStorage,
  whitelist: [dataSlice.name, devSlice.name],
  stateReconciler: autoMergeLevel2,
};

const persistedReducer = persistReducer<RootState>(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
