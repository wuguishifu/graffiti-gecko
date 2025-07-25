import { useEffect, useRef } from 'react';

import { sessionActions } from '../state/session-slice';

import { useAppDispatch } from '@/state/use-app-state';

export function InitialInteractionDetector() {
  const dispatch = useAppDispatch();
  const dispatchRef = useRef(dispatch);

  useEffect(() => {
    function handleUserInteraction() {
      dispatchRef.current(sessionActions.setSoundOn(true));
      window.removeEventListener('click', handleUserInteraction);
    }

    window.addEventListener('click', handleUserInteraction);

    return () => {
      window.removeEventListener('click', handleUserInteraction);
    };
  }, []);

  return null;
}
