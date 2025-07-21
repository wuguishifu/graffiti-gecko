import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { dataSlice } from './dataSlice';
import { gameSlice } from './gameSlice';

const rootReducer = combineReducers({
  [gameSlice.name]: gameSlice.reducer,
  [dataSlice.name]: dataSlice.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: true,
      serializableCheck: true,
    }),
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
