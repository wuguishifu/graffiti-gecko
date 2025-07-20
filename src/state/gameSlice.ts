import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type GameSliceState = {
  score: number;
  buttonVisible: boolean;
};

const initialState: GameSliceState = {
  score: 0,
  buttonVisible: false,
}

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    incrementScore: (state, action: PayloadAction<number | undefined>) => {
      state.score += action.payload ?? 1;
    },
    setButtonVisible: (state, action: PayloadAction<boolean>) => {
      console.log('Setting button visibility to:', action.payload);
      state.buttonVisible = action.payload;
    },
    reset: () => initialState,
  },
});

export const gameActions = gameSlice.actions;
