import { createSlice } from '@reduxjs/toolkit';

/*
  Redux slice for managing settings and app data.
  Things in this slice WILL be persisted across sessions.
*/

type DataSliceState = {
  sprayColor: string;
};

const initialState: DataSliceState = {
  sprayColor: '#FF00D0',
};

export const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setSprayColor: (state, action) => {
      state.sprayColor = action.payload;
    },
  },
});

export const dataActions = dataSlice.actions;
