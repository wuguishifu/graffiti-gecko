import { createSlice } from '@reduxjs/toolkit';

export type DevSliceState = {
  disableCopAi: boolean;
  godMode: boolean;
  manySprayCans: boolean;
  onePercentFill: boolean;
  isDirty: boolean;
};

const initialState: DevSliceState = {
  disableCopAi: false,
  godMode: false,
  manySprayCans: false,
  onePercentFill: false,
  isDirty: false,
};

export const devSlice = createSlice({
  name: 'dev',
  initialState,
  reducers: {
    toggleCopAi: (state) => {
      state.disableCopAi = !state.disableCopAi;
    },
    toggleGodMode: (state) => {
      state.godMode = !state.godMode;
    },
    toggleManySprayCans: (state) => {
      state.manySprayCans = !state.manySprayCans;
    },
    toggleOnePercentFill: (state) => {
      state.onePercentFill = !state.onePercentFill;
    },
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      (action) => action.type.startsWith(devSlice.name + '/') && action.type !== devSlice.actions.reset.type,
      (state) => {
        state.isDirty = true;
      },
    );
  },
});

export const devActions = devSlice.actions;
