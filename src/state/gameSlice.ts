import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type GameSliceState = {
  score: number;
  sprayAreaVisible: boolean;
  nearSprayCan: boolean;
  sprayCans: Record<number, boolean>;
  activeSprayCanId?: number;
  lives: number;
  gameOverFlag?: boolean;
};

const initialState: GameSliceState = {
  score: 0,
  sprayAreaVisible: false,
  nearSprayCan: false,
  sprayCans: {},
  lives: 3,
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
    setNearSprayCan: (state, action: PayloadAction<boolean>) => {
      state.nearSprayCan = action.payload;
      if (!action.payload) {
        state.activeSprayCanId = undefined;
      }
    },
    resetSprayArea: (state) => {
      state.sprayCans = {};
    },
    setSprayCans: (state, action: PayloadAction<number[]>) => {
      state.sprayCans = action.payload.reduce<Record<number, boolean>>((acc, canId) => {
        acc[canId] = false;
        return acc;
      }, {});
    },
    setActiveSprayCanId: (state, action: PayloadAction<number | undefined>) => {
      state.activeSprayCanId = action.payload;
    },
    completeSprayCan: (state) => {
      if (state.activeSprayCanId !== undefined) {
        state.sprayCans[state.activeSprayCanId] = true;
      }
    },
    setLives: (state, action: PayloadAction<number>) => {
      state.lives = action.payload;
    },
    setGameOverFlag: (state, action: PayloadAction<boolean>) => {
      state.gameOverFlag = action.payload;
    },
    reset: () => initialState,
  },
});

export const gameActions = gameSlice.actions;
