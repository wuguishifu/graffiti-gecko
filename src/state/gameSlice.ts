import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type GameSliceState = {
  score: number;
  sprayAreaVisible: boolean;
};

const initialState: GameSliceState = {
  score: 0,
  sprayAreaVisible: false,
}

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    incrementScore: (state, action: PayloadAction<number | undefined>) => {
      state.score += action.payload ?? 1;
    },
    setSprayAreaVisible: (state, action: PayloadAction<boolean>) => {
      state.sprayAreaVisible = action.payload;
    },
    reset: () => initialState,
  },
});

export const gameActions = gameSlice.actions;
