import { createSlice } from '@reduxjs/toolkit';

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
