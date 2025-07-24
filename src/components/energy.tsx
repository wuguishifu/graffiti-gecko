import { useAppSelector } from '@/state/use-app-state';

export function Energy() {
  const energyPercent = useAppSelector((state) => state.game.energyPercent);

  return (
    <div className="relative h-40 flex items-center">
      <div className="relative flex items-center h-12 w-96 border-3 border-white bg-[#665F4D] rounded-xl overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-[#4EC027] transition-all duration-100"
          style={{ width: `${energyPercent}%` }}
        />
      </div>
      <img className="absolute -left-6 -mt-2 z-20 size-16" src="/assets/icons/lightning.png" />
    </div>
  );
}
