import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/*
  Redux slice for managing game state.
  Things in this slice will not be persisted across sessions.
*/

type GameSliceState = {
  sprayAreaVisible: boolean;
  nearSprayCan: boolean;
  sprayCans: Record<number, boolean>;
  activeSprayCanId?: number;
  lives: number;
  gameOverFlag?: boolean;
  distanceTraveled: number;
  totalSprayCansCompleted: number;
  currentLevel: number;
  pauseMenuVisible?: boolean;
  timeLeft: number;
};

const initialState: GameSliceState = {
  sprayAreaVisible: false,
  nearSprayCan: false,
  sprayCans: {},
  lives: 3,
  distanceTraveled: 0,
  totalSprayCansCompleted: 0,
  currentLevel: 1,
  timeLeft: 60 * 5,
}

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
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
        console.log(`Completing spray can ${state.activeSprayCanId}, total now: ${state.totalSprayCansCompleted + 1}`);
      }
      state.totalSprayCansCompleted++;
    },
    setLives: (state, action: PayloadAction<number>) => {
      state.lives = action.payload;
    },
    setGameOverFlag: (state, action: PayloadAction<boolean>) => {
      state.gameOverFlag = action.payload;
    },
    setDistanceTraveled: (state, action: PayloadAction<number>) => {
      state.distanceTraveled = action.payload;
    },
    setCurrentLevel: (state, action: PayloadAction<number>) => {
      state.currentLevel = action.payload;
    },
    incrementLevel: (state) => {
      state.currentLevel++;
    },
    setPauseMenuVisible: (state, action: PayloadAction<boolean>) => {
      state.pauseMenuVisible = action.payload;
    },
    setTimeLeft: (state, action: PayloadAction<number>) => {
      state.timeLeft = action.payload;
    },
    reset: () => initialState,
  },
});

export const gameActions = gameSlice.actions;
