import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type DevSliceState = {
  disableCopAi: boolean;
  unlimitedStamina: boolean;
  overrideTotalTime: number;
  godMode: boolean;
  isDirty: boolean;
};

const initialState: DevSliceState = {
  disableCopAi: false,
  unlimitedStamina: false,
  overrideTotalTime: 0,
  godMode: false,
  isDirty: false,
};

export const devSlice = createSlice({
  name: 'dev',
  initialState,
  reducers: {
    toggleCopAi: (state) => {
      state.disableCopAi = !state.disableCopAi;
    },
    setTotalTime: (state, action: PayloadAction<number | undefined>) => {
      state.overrideTotalTime = action.payload ?? 0;
    },
    toggleUnlimitedStamina: (state) => {
      state.unlimitedStamina = !state.unlimitedStamina;
    },
    toggleGodMode: (state) => {
      state.godMode = !state.godMode;
    },
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      (action) =>
        action.type.startsWith(devSlice.name + '/') &&
        action.type !== devSlice.actions.reset.type,
      (state) => {
        state.isDirty = true
      }
    );
  }
});

export const devActions = devSlice.actions;
