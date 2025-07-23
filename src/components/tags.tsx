import { useAppSelector } from '@/state/use-app-state';

export function Tags() {
  const sprayCans = useAppSelector((state) => state.game.sprayCans);
  const currentLevel = useAppSelector((state) => state.game.currentLevel);

  const totalCompleted = Object.values(sprayCans).filter(completed => completed).length;
  const totalSprayCans = Object.keys(sprayCans).length;

  const progress = totalCompleted / totalSprayCans;

  return (
    <div className='relative'>
      <div className='flex items-center gap-2 ml-2'>
        <img src='/assets/copy/level.svg' />
        <p className='!text-black text-5xl font-bold font-blank-river mt-2'>{currentLevel}</p>
      </div>
      <div className='relative flex items-center h-12 w-72 border-3 border-black bg-[#665F4D] rounded-xl'>
        <div className='absolute left-0 top-0 h-full bg-[#FFDB00] rounded-l-xl' style={{ width: `${progress * 100}%` }} />
        <div className='flex-1' />
        <div className='flex-1 border-l-3 border-black h-full z-10' />
        <div className='flex-1 border-l-3 border-black h-full z-10' />
        <img className='absolute -left-10 -mt-2 z-20 size-20' src='/assets/icons/can.png' />
      </div>
    </div>
  );
}
