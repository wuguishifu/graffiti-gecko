import { useAppSelector } from '../state/useAppState';

export function GameOver() {
  const distanceTraveled = useAppSelector((state) => state.game.distanceTraveled);
  const totalSprayCansCompleted = useAppSelector((state) => state.game.totalSprayCansCompleted);

  return (
    <div className='absolute top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center'>
      <div className='text-center'>
        <div className='text-4xl font-bold text-white mb-8'>Game Over</div>
        <div className='text-xl text-white mb-4'>
          Distance Traveled: {distanceTraveled.toFixed(1)} units
        </div>
        <div className='text-xl text-white mb-4'>
          Tags Completed: {totalSprayCansCompleted}
        </div>
        <a href='/' className='w-72 py-4 border rounded-xl flex justify-center cursor-pointer bg-gray-900 hover:bg-gray-800 transition-colors'>
          <h1 className='text-2xl'>
            Menu
          </h1>
        </a>
      </div>
    </div>
  );
}
