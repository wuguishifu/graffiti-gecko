import { createSlice } from '@reduxjs/toolkit';

type DevSliceState = {
  disableCopAi: boolean;
};

const initialState: DevSliceState = {
  disableCopAi: false,
};

export const devSlice = createSlice({
  name: 'dev',
  initialState,
  reducers: {
    toggleCopAi: (state) => {
      state.disableCopAi = !state.disableCopAi;
    },
    reset: () => initialState,
  },
});

export const devActions = devSlice.actions;
