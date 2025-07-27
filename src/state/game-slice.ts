import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { SprayCanState } from '../game/entities/spray-can';

/*
  Redux slice for managing game state.
  Things in this slice will not be persisted across sessions.
*/

type GameSliceState = {
  sprayAreaVisible: boolean;
  nearSprayCan: boolean;
  sprayCans: Record<number, SprayCanState>;
  activeSprayCanId?: number;
  lives: number;
  gameOverFlag?: boolean;
  distanceTraveled: number;
  totalSprayCansCompleted: number;
  currentLevel: number;
  pauseMenuVisible?: boolean;
  dodgeState: {
    canDodge: boolean;
    isDodging: boolean;
    isOnCooldown: boolean;
    cooldownRemainingMs: number;
  };
};

const initialState: GameSliceState = {
  sprayAreaVisible: false,
  nearSprayCan: false,
  sprayCans: {},
  lives: 3,
  distanceTraveled: 0,
  totalSprayCansCompleted: 0,
  currentLevel: 1,
  dodgeState: {
    canDodge: true,
    isDodging: false,
    isOnCooldown: false,
    cooldownRemainingMs: 0,
  },
};

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setSprayAreaVisible: (state, action: PayloadAction<boolean>) => {
      state.sprayAreaVisible = action.payload;
    },
    setNearSprayCan: (state, action: PayloadAction<boolean>) => {
      state.nearSprayCan = action.payload;
    },
    resetSprayArea: (state) => {
      state.sprayCans = {};
    },
    setSprayCans: (state, action: PayloadAction<number[]>) => {
      state.sprayCans = action.payload.reduce<Record<number, SprayCanState>>((acc, canId) => {
        acc[canId] = 'available';
        return acc;
      }, {});
    },
    addSprayCan: (state, action: PayloadAction<number>) => {
      const canId = action.payload;
      state.sprayCans[canId] = 'available';
    },
    setActiveSprayCanId: (state, action: PayloadAction<number>) => {
      state.activeSprayCanId = action.payload;
    },
    completeSprayCan: (state) => {
      if (state.activeSprayCanId !== undefined) {
        state.sprayCans[state.activeSprayCanId] = 'completed';
        console.log(`Completing spray can ${state.activeSprayCanId}, total now: ${state.totalSprayCansCompleted + 1}`);
      }
      state.totalSprayCansCompleted++;
    },
    failSprayCan: (state) => {
      if (state.activeSprayCanId !== undefined) {
        state.sprayCans[state.activeSprayCanId] = 'failed';
        console.log(`Failing spray can ${state.activeSprayCanId}`);
      }
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
    updateDodgeState: (state, action: PayloadAction<Partial<GameSliceState['dodgeState']>>) => {
      state.dodgeState = {
        ...state.dodgeState,
        ...action.payload,
      };
    },
    reset: () => initialState,
  },
});

export const gameActions = gameSlice.actions;
