import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { gameSlice } from './gameSlice';

const rootReducer = combineReducers({
  [gameSlice.name]: gameSlice.reducer,
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
