import { Timer } from './timer';

import { useAppSelector } from '@/state/use-app-state';
import { secondsToTimeString } from '@/util/time-utils';

export function Lives() {
  const lives = useAppSelector((state) => state.game.lives);
  const totalLives = 3;
  const timeLeft = useAppSelector((state) => state.game.timeLeft);
  const totalTime = useAppSelector((state) => state.dev.overrideTotalTime || 300);

  return (
    <div className='h-40 flex items-center'>
      <div className='bg-[#665F4D] border-3 border-white h-12 w-96 flex justify-center rounded-xl'>
        <div className='flex items-center gap-2'>
          {Array.from({ length: totalLives }, (_, index) => (
            lives > index
              ? <img key={index} src='/assets/icons/heart-full.png' className='size-8' />
              : <img key={index} src='/assets/icons/heart-empty.png' className='size-8' />
          ))}
          <div className='relative w-20 flex items-center justify-center'>
            <div className='absolute'>
              <Timer
                remainingDurationSeconds={timeLeft}
                totalDurationSeconds={totalTime}
                size={64}
                strokeWidth={3}
              />
            </div>
          </div>
          <p className='font-blank-river text-3xl w-12'>
            {secondsToTimeString(timeLeft)}
          </p>
        </div>
      </div>
    </div>
  );
}
