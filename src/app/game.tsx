import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Game } from '../game/game';
import { SprayArea, type SprayAreaRef } from '../spray/spray-area';
import { GameProvider } from '../state/game-context';
import { GamePauser } from '../state/game-pauser';
import { gameActions } from '../state/gameSlice';
import { useAppDispatch, useAppSelector } from '../state/useAppState';
import { Hud } from '../ui/hud';
import { PauseMenu } from '../ui/pause-menu';

export function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameInstance = useRef<Game | null>(null);

  const dispatch = useAppDispatch();
  const dispatchRef = useRef(dispatch);
  const nearSprayCan = useAppSelector((state) => state.game.nearSprayCan);
  const gameOverFlag = useAppSelector((state) => state.game.gameOverFlag);

  const navigate = useNavigate();

  useEffect(() => {
    if (canvasRef.current) {
      // Reset game state for new session
      dispatch(gameActions.reset());
      gameInstance.current = new Game(canvasRef.current);
    }

    return () => {
      if (gameInstance.current) {
        gameInstance.current.destroy();
        gameInstance.current = null;
      }
    }
  }, []);

  const onOpenSprayArea = useCallback(() => {
    sprayAreaRef.current?.reset();
    dispatchRef.current(gameActions.setSprayAreaVisible(true));
  }, []);

  const sprayAreaRef = useRef<SprayAreaRef>(null);

  useEffect(() => {
    if (gameOverFlag) {
      navigate('/game-over');
    }
  }, [gameOverFlag]);

  const pauseMenuVisible = useAppSelector((state) => state.game.pauseMenuVisible);

  return (
    <GameProvider gameInstance={gameInstance}>
      <main className="h-full flex items-center">
        <div className="w-full aspect-video">
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
        <div className='absolute top-0 left-0 w-full h-full px-20 py-16'>
          <div className='relative w-full h-full'>
            {nearSprayCan && (
              <div
                className='absolute bottom-0 right-0 bg-white/50 w-40 h-20 rounded-xl flex items-center justify-center hover:opacity-80 cursor-pointer'
                onClick={onOpenSprayArea}
              >
                <img src="/assets/icons/can.png" />
              </div>
            )}
          </div>
        </div>
        <Hud />
        <SprayArea ref={sprayAreaRef} />
        {pauseMenuVisible && <PauseMenu />}
        <GamePauser />
      </main>
    </GameProvider>
  );
}
