import { useAppSelector } from '@/state/use-app-state';

export function Tags() {
  const sprayCans = useAppSelector((state) => state.game.sprayCans);
  const currentLevel = useAppSelector((state) => state.game.currentLevel);

  const totalCompleted = Object.values(sprayCans).filter((state) => state === 'completed').length;
  const totalSprayCans = Object.values(sprayCans).filter((state) => state !== 'failed').length;

  const progress = totalCompleted / totalSprayCans;

  return (
    <div className="relative h-40 flex items-center">
      <div className="absolute flex items-center ml-2 top-0">
        <div className="w-36 h-9 bg-[#E0E5F4] absolute top-2 left-0 rounded-full" />
        <img src="./assets/copy/level.svg" className="scale-75 z-10" />
        <p className="!text-black text-4xl font-bold font-blank-river mt-2 z-10">{currentLevel}</p>
      </div>
      <div className="relative flex items-center h-12 w-96 border-3 border-white bg-[#665F4D] rounded-xl overflow-hidden">
        <div className="absolute left-0 top-0 h-full bg-[#FFDB00]" style={{ width: `${progress * 100}%` }} />
      </div>
      <img className="absolute -left-10 -mt-2 z-20 size-20" src="./assets/icons/can.png" />
      <div className="absolute flex items-center ml-2 bottom-0 right-0">
        <div className="w-56 h-9 bg-[#E0E5F4] absolute top-2 -left-4 rounded-full" />
        <p className="!text-black text-4xl font-bold font-blank-river mt-2 z-10">
          {totalCompleted}/{totalSprayCans}
        </p>
        <img src="./assets/copy/tags-done.svg" className="scale-75 z-10" />
      </div>
    </div>
  );
}
