import { Lives } from '@/components/lives';
import { Tags } from '@/components/tags';
import { useAppSelector } from '../state/use-app-state';

type HudProps = {
  onOpenSprayArea: () => void;
}

export function Hud({ onOpenSprayArea }: HudProps) {
  const nearSprayCan = useAppSelector((state) => state.game.nearSprayCan);
  const devMode = useAppSelector((state) => state.dev.isDirty);

  return (
    <div className='absolute top-0 left-0 w-full h-full px-20 py-16'>
      <div className='relative w-full h-full'>
        <div className='absolute top-0 left-0'>
          <Tags />
        </div>
        <div className='absolute top-0 right-0'>
          <Lives />
        </div>
        {nearSprayCan && (
          <button
            className='absolute bottom-0 right-0 cursor-pointer hover:scale-110 transition-transform'
            onClick={onOpenSprayArea}
            tabIndex={-1}
          >
            <img src="/assets/icons/can.png" className='size-64 pointer-events-none select-none' tabIndex={-1} />
          </button>
        )}
        {devMode && (
          <div className='absolute top-0 w-full flex justify-center'>
            <span className='!text-red-500 font-bold'>dev mode enabled - score will not be saved</span>
          </div>
        )}
      </div>
    </div>
  )
}
