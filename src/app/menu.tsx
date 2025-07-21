import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { SettingsMenu } from '../ui/settings-menu';
import { useAppDispatch } from '../state/useAppState';
import { gameActions } from '../state/gameSlice';

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
    <main className='h-full flex items-center justify-center'>
      <img
        className='absolute top-0 left-0 w-full h-full -z-10 select-none pointer-events-none object-cover'
        src='/assets/screens/start.png'
      />
      <div className='text-center absolute top-[50%] left-[30%] flex flex-col gap-8'>
        <Link to='/game' className='hover:scale-110 transition-transform' onClick={() => dispatch(gameActions.reset())}>
          <img src='/assets/copy/start-run.svg' />
        </Link>
        <button className='hover:scale-110 transition-transform cursor-pointer' onClick={() => setShowSettings(true)}>
          <img src='/assets/copy/settings.svg' />
        </button>
      </div>
      {showSettings && <SettingsMenu onHide={() => setShowSettings(false)} />}
    </main>
  );
}
