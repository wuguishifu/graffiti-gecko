import { gameActions } from '@/state/game-slice';
import { useAppDispatch } from '@/state/use-app-state';
import { useEffect, useRef } from 'react';

export function InitialInteractionDetector() {
  const dispatch = useAppDispatch();
  const dispatchRef = useRef(dispatch);

  useEffect(() => {
    function handleUserInteraction() {
      dispatchRef.current(gameActions.setSoundOn(true));
      window.removeEventListener('click', handleUserInteraction);
    }

    window.addEventListener('click', handleUserInteraction);

    return () => {
      window.removeEventListener('click', handleUserInteraction);
    };
  }, []);

  return null;
}
