import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type GameSliceState = {
  score: number;
};

const initialState: GameSliceState = {
  score: 0,
}

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    incrementScore: (state, action: PayloadAction<number | undefined>) => {
      state.score += action.payload ?? 1;
    },
    reset: () => initialState,
  },
});
