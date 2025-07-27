import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';

import { soundService } from '../game/sound/sound';
import { gameActions } from '../state/game-slice';
import { useAppDispatch, useAppSelector } from '../state/use-app-state';

export function GameOver() {
  const totalSprayCansCompleted = useAppSelector((state) => state.game.totalSprayCansCompleted);
  const currentLevel = useAppSelector((state) => state.game.currentLevel);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        navigate('/');
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [navigate]);

  return (
    <main className="absolute top-0 left-0 w-full h-full flex items-center justify-center select-none">
      <img className="absolute top-0 left-0 w-full h-full object-cover" src="/assets/backgrounds/brick.webp" />
      <img className="absolute -top-48 h-full object-cover ml-8" src="/assets/backgrounds/game-over-splash.png" />
      <div className="flex flex-col items-center gap-8 z-10 h-full py-20">
        <img src="/assets/copy/run-over.svg" className="pointer-events-none" />
        <div className="bg-[#FD50B4] rounded-xl pb-4 flex flex-col gap-4 mt-48 border-3 border-black overflow-hidden shadow-[4px_4px_4px_0px_rgba(0,0,0,1)]">
          <div className="w-full py-4 bg-gradient-to-b from-[#FFA77D] to-[#FD50B4] border-b-3 border-black flex items-center justify-center">
            <p className="text-6xl font-graffiti-youth !text-black">Level {currentLevel}</p>
          </div>
          <div className="px-20 flex flex-col items-center gap-2">
            <img src="/assets/copy/tags-completed.svg" className="pointer-events-none" />
            <p className="text-5xl font-graffiti-youth !text-black">{totalSprayCansCompleted}</p>
          </div>
        </div>
        <Link
          to="/game"
          className="hover:scale-110 transition-transform"
          onMouseEnter={() => soundService.playSound('hover')}
          onClick={() => {
            dispatch(gameActions.reset());
            soundService.playSound('click');
          }}
        >
          <img src="/assets/copy/new-run.svg" />
        </Link>
        <Link
          to="/"
          className="hover:scale-110 transition-transform"
          onMouseEnter={() => soundService.playSound('hover')}
          onClick={() => {
            soundService.playSound('click');
          }}
        >
          <img src="/assets/copy/main-menu.svg" />
        </Link>
      </div>
    </main>
  );
}
