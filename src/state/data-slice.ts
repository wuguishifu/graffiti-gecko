import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/*
  Redux slice for managing settings and app data.
  Things in this slice WILL be persisted across sessions.
*/

type DataSliceState = {
  sprayColor: string;
  musicVolume: number;
  soundVolume: number;
};

const initialState: DataSliceState = {
  sprayColor: '#FF00D0',
  musicVolume: 0.3,
  soundVolume: 0.3,
};

export const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setSprayColor: (state, action: PayloadAction<string>) => {
      state.sprayColor = action.payload;
    },
    setMusicVolume: (state, action: PayloadAction<number>) => {
      state.musicVolume = action.payload;
    },
    setSoundVolume: (state, action: PayloadAction<number>) => {
      state.soundVolume = action.payload;
    },
  },
});

export const dataActions = dataSlice.actions;
