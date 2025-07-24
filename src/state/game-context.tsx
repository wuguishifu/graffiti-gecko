import { createContext, useContext } from 'react';

import type { Game } from '../game/game';

type GameContextType = {
  gameInstance: React.RefObject<Game | null>;
};

const GameContext = createContext<GameContextType>({
  gameInstance: { current: null },
});

export function useGame() {
  return useContext(GameContext);
}

export function GameProvider({
  children,
  gameInstance,
}: {
  children: React.ReactNode;
  gameInstance: React.RefObject<Game | null>;
}) {
  return <GameContext.Provider value={{ gameInstance }}>{children}</GameContext.Provider>;
}
