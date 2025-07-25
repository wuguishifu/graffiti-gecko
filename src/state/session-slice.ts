import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type SessionSliceState = {
  soundOn: boolean;
};

const initialState: SessionSliceState = {
  soundOn: false,
};

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSoundOn: (state, action: PayloadAction<boolean>) => {
      state.soundOn = action.payload;
    },
  },
});

export const sessionActions = sessionSlice.actions;
