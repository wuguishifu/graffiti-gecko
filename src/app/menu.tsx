import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import { soundService } from '../game/sound/sound.ts';
import { gameActions } from '../state/game-slice';
import { useAppDispatch } from '../state/use-app-state';
import { SettingsMenu } from '../ui/settings-menu';

import { buttonVariants } from '@/components/ui/button';

export function MainMenu() {
  const [showSettings, setShowSettings] = useState(false);

  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSettings(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <main className="h-full flex items-center justify-center">
      <img
        className="absolute top-0 left-0 w-full h-full select-none pointer-events-none object-cover"
        src="/assets/screens/start.png"
      />
      <div className="text-center absolute top-[50%] left-[30%] flex flex-col gap-8">
        <Link
          to="/game"
          className="hover:scale-110 transition-transform"
          onMouseEnter={() => soundService.playSound('hover')}
          onClick={() => {
            soundService.playSound('click');
            dispatch(gameActions.reset());
          }}
        >
          <img src="/assets/copy/start-run.svg" className="select-none pointer-events-none" />
        </Link>
        <button
          onMouseEnter={() => soundService.playSound('hover')}
          onClick={() => {
            soundService.playSound('click');
            setShowSettings(true);
          }}
          className="hover:scale-110 transition-transform cursor-pointer"
        >
          <img src="/assets/copy/settings.svg" className="select-none pointer-events-none" />
        </button>
      </div>
      <div className="absolute top-0 right-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <Link to="/dev" className={buttonVariants({ variant: 'default' })}>
          Dev
        </Link>
      </div>
      {showSettings && <SettingsMenu onHide={() => setShowSettings(false)} />}
    </main>
  );
}
