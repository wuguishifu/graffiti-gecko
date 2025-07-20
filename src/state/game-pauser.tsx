import { useEffect } from 'react';
import { useGame } from './game-context';
import { useAppSelector } from './useAppState';

export function GamePauser() {
  const { gameInstance } = useGame();

  const sprayAreaVisible = useAppSelector((state) => state.game.sprayAreaVisible);

  useEffect(() => {
    if (sprayAreaVisible) {
      gameInstance.current?.pause();
    } else {
      gameInstance.current?.resume();
    }
  }, [gameInstance, sprayAreaVisible]);

  return null;
}
