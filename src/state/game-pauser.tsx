import { useEffect } from 'react';
import { useGame } from './game-context';
import { useAppSelector } from './useAppState';

export function GamePauser() {
  const { gameInstance } = useGame();

  const sprayAreaVisible = useAppSelector((state) => state.game.sprayAreaVisible);
  const pauseMenuVisible = useAppSelector((state) => state.game.pauseMenuVisible);

  useEffect(() => {
    if (sprayAreaVisible || pauseMenuVisible) {
      gameInstance.current?.pause();
    } else {
      gameInstance.current?.resume();
    }
  }, [gameInstance, sprayAreaVisible, pauseMenuVisible]);

  return null;
}
