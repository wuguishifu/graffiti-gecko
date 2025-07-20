import { useAppSelector } from '../state/useAppState';

export function SprayArea() {
  const sprayAreaVisible = useAppSelector((state) => state.game.sprayAreaVisible);

  return (
    <div
      className='absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white/20'
      style={{ zIndex: sprayAreaVisible ? 1000 : -1 }}
    >
      <img
        className='absolute top-0 left-0 w-full h-full select-none pointer-events-none'
        src='/assets/backgrounds/brick.png'
      />
      <img className='h-1/2 z-10 select-none pointer-events-none' src='/assets/tags/z.png' />
    </div>
  );
}
