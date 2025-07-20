import { useEffect, useRef } from 'react';
import { Game } from '../game/game';
import { useAppSelector } from '../state/useAppState';

export function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameInstance = useRef<Game | null>(null);

  const buttonVisible = useAppSelector((state) => state.game.buttonVisible);

  useEffect(() => {
    if (canvasRef.current) {
      gameInstance.current = new Game(canvasRef.current);
    }

    return () => {
      gameInstance.current?.destroy();
    }
  }, []);

  return (
    <main className="h-full flex items-center">
      <div className="w-full aspect-video border">
        <canvas
          onContextMenu={e => e.preventDefault()}
          ref={canvasRef}
          id="gameCanvas"
          className="w-full h-full focus:outline-none"
          width={1920}
          height={1080}
        >
          Your browser does not support the HTML5 canvas element.
        </canvas>
        <div className="absolute top-0 left-0 w-full h-full flex px-20 py-20">
          <h1 className='text-3xl'>hello world</h1>
          <div className='flex-1'></div>
          {buttonVisible && (
            <div className='w-72 py-4 border rounded-xl flex justify-center cursor-pointer bg-gray-900 hover:bg-gray-800 transition-colors'>
              <h1 className='text-2xl'>
                Random Button
              </h1>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
