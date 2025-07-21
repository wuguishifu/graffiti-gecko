import { gameActions } from '../state/gameSlice';
import { useAppDispatch, useAppSelector } from '../state/useAppState';
import { secondsToTimeString } from '../util/time-utils';

export function PauseMenu() {
  const currentLevel = useAppSelector((state) => state.game.currentLevel);
  const timeLeft = useAppSelector((state) => state.game.timeLeft);
  const tagsCompleted = useAppSelector((state) => state.game.totalSprayCansCompleted);

  const dispatch = useAppDispatch();

  return (
    <div className='absolute top-0 left-0 w-full h-full flex items-center justify-center z-50 bg-black select-none'>
      <img className='absolute top-0 left-0 w-full h-full object-cover -z-20 pointer-events-none' src='/assets/backgrounds/wall.webp' />
      <img
        className='absolute h-[90%] select-none pointer-events-none -z-10' src='/assets/tags/spray-bg.webp' />
      <div className='flex flex-col items-center gap-8'>
        <img src='/assets/copy/game-paused.svg' className='pointer-events-none' />
        <p className='text-6xl font-blank-river !text-black'>Level {currentLevel}</p>
        <div className='flex flex-row items-center gap-12 w-[50rem] h-38'>
          <div className='bg-[#EF64C9]/80 rounded-xl flex-1 h-full flex flex-col items-center gap-2 shadow justify-center'>
            <img src='/assets/copy/tags-completed.svg' className='pointer-events-none' />
            <p className='text-5xl font-graffiti-youth !text-black'>{tagsCompleted}</p>
          </div>
          <div className='bg-[#EF64C9]/80 rounded-xl flex-1 h-full flex flex-col items-center gap-2 shadow justify-center'>
            <img src='/assets/copy/time-left.svg' className='pointer-events-none' />
            <p className='text-5xl font-graffiti-youth !text-black'>{secondsToTimeString(timeLeft)}</p>
          </div>
        </div>
        <button className='hover:scale-110 transition-transform cursor-pointer' onClick={() => dispatch(gameActions.setPauseMenuVisible(false))}>
          <img src='/assets/copy/continue.svg' />
        </button>
        <a href='/' className='hover:scale-110 transition-transform'>
          <img src='/assets/copy/quit-game.svg' />
        </a>
      </div>
    </div>
  );
}
