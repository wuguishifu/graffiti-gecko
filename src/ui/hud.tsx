import { useAppSelector } from '../state/useAppState';

export function Hud() {
  const sprayCans = useAppSelector((state) => state.game.sprayCans);
  const lives = useAppSelector((state) => state.game.lives);

  const totalCompleted = Object.values(sprayCans).filter(completed => completed).length;
  const totalSprayCans = Object.keys(sprayCans).length;

  return (
    <div className='absolute top-0 left-0 w-full h-full px-20 py-16'>
      <div className='relative w-full h-full'>
        <div className='absolute top-0 left-0'>
          {totalCompleted} / {totalSprayCans} tags completed
        </div>
        <div className='absolute top-0 right-0'>
          Lives: {lives}
        </div>
      </div>
    </div>
  )
}
