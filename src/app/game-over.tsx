import { useAppSelector } from '../state/useAppState';

export function GameOver() {
  const totalSprayCansCompleted = useAppSelector((state) => state.game.totalSprayCansCompleted);
  const currentLevel = useAppSelector((state) => state.game.currentLevel);

  return (
    <main className='absolute top-0 left-0 w-full h-full flex items-center justify-center select-none'>
      <img className='absolute top-0 left-0 w-full h-full -z-10 object-cover' src='/assets/backgrounds/brick.png' />
      <div className='flex flex-col items-center gap-8'>
        <img src='/assets/copy/run-over.svg' className='pointer-events-none' />
        <p className='text-6xl font-blank-river'>Level {currentLevel}</p>
        <div className='bg-[#EF64C9]/80 rounded-xl px-20 py-4 flex flex-col items-center gap-2 shadow'>
          <img src='/assets/copy/tags-completed.svg' className='pointer-events-none' />
          <p className='text-5xl font-graffiti-youth !text-black'>{totalSprayCansCompleted}</p>
        </div>
        <a href='/game' className='hover:scale-110 transition-transform'>
          <img src='/assets/copy/new-run.svg' />
        </a>
        <a href='/' className='hover:scale-110 transition-transform'>
          <img src='/assets/copy/main-menu.svg' />
        </a>
      </div>
    </main>
  );
}
