import { useEffect, useRef } from 'react';
import { Game } from '../game/game';

export function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameInstance = useRef<Game | null>(null);

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
          ref={canvasRef}
          id="gameCanvas"
          className="w-full h-full focus:outline-none"
          width={1920}
          height={1080}
        >
          Your browser does not support the HTML5 canvas element.
        </canvas>
      </div>
    </main>
  );
}
