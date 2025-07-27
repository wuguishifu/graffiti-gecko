import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';

import { Game } from '../game/game';
import { soundService } from '../game/sound/sound';
import { SprayArea, type SprayAreaRef } from '../spray/spray-area';
import { GameProvider } from '../state/game-context';
import { GamePauser } from '../state/game-pauser';
import { gameActions } from '../state/game-slice';
import { store } from '../state/store';
import { useAppDispatch, useAppSelector } from '../state/use-app-state';
import { Hud } from '../ui/hud';
import { PauseMenu } from '../ui/pause-menu';

export function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameInstance = useRef<Game | null>(null);

  const dispatch = useAppDispatch();
  const dispatchRef = useRef(dispatch);
  const gameOverFlag = useAppSelector((state) => state.game.gameOverFlag);

  const navigate = useNavigate();

  useEffect(() => {
    if (canvasRef.current) {
      gameInstance.current = new Game(canvasRef.current, store.getState().dev);
    }

    return () => {
      if (gameInstance.current) {
        gameInstance.current.destroy();
        gameInstance.current = null;
      }
    };
  }, []);

  const soundOn = useAppSelector((state) => state.session.soundOn);

  useEffect(() => {
    const randSong = soundService.randomGameMusicKey();
    if (soundOn) {
      soundService.playSound(randSong, 0.3, true);
    }

    return () => {
      soundService.stopSound(randSong);
    };
  }, [soundOn]);

  const onOpenSprayArea = useCallback(() => {
    sprayAreaRef.current?.reset();
    dispatchRef.current(gameActions.setSprayAreaVisible(true));
  }, []);

  const sprayAreaRef = useRef<SprayAreaRef>(null);

  useEffect(() => {
    if (gameOverFlag) {
      navigate('/game-over');
    }
  }, [gameOverFlag, navigate]);

  const pauseMenuVisible = useAppSelector((state) => state.game.pauseMenuVisible);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ') {
        event.preventDefault();
        if (store.getState().game.sprayAreaVisible) {
          return;
        }

        if (store.getState().game.nearSprayCan) {
          sprayAreaRef.current?.reset();
          onOpenSprayArea();
          return;
        }

        gameInstance.current?.player?.dodge();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onOpenSprayArea]);

  const sprayAreaVisible = useAppSelector((state) => state.game.sprayAreaVisible);

  return (
    <GameProvider gameInstance={gameInstance}>
      <main className="h-full flex items-center bg-black">
        <div className="h-full">
          <canvas
            ref={canvasRef}
            id="gameCanvas"
            className="w-full h-full focus:outline-none bg-black"
            width={1920}
            height={1080}
          >
            Your browser does not support the HTML5 canvas element.
          </canvas>
        </div>
        <div className="absolute top-0 left-0 w-full h-full px-20 py-16"></div>
        <Hud onOpenSprayArea={onOpenSprayArea} />
        {sprayAreaVisible && <SprayArea ref={sprayAreaRef} />}
        {pauseMenuVisible && <PauseMenu />}
        <GamePauser />
      </main>
    </GameProvider>
  );
}
