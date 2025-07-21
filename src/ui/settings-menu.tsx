import { useCallback, useRef } from 'react';
import { dataActions } from '../state/dataSlice';
import { useAppDispatch, useAppSelector } from '../state/useAppState';

const colors = [
  '#FF00D0',
  '#78D441',
  '#71FFF3',
  '#FFF600',
  '#FF8000',
];

export function SettingsMenu({ onHide }: { onHide: () => void }) {
  const dispatch = useAppDispatch();
  const dispatchRef = useRef(dispatch);

  const changeColorFn = useCallback((color: string) =>
    () => dispatchRef.current(dataActions.setSprayColor(color)),
    [],
  );

  const selectedColor = useAppSelector((state) => state.data.sprayColor);

  return (
    <div className='absolute top-0 right-0 w-full h-full flex items-center justify-center bg-white/20 backdrop-blur-md z-50'>
      <div className='bg-[#FD50B4] p-16 rounded-lg flex flex-col items-center' style={{
        filter: 'drop-shadow(15px 15px 4px rgba(0, 0, 0, 0.60))'
      }}>
        <img src='/assets/copy/settings-title.svg' />
        <div className='mt-24 flex items-center gap-4'>
          <p className='text-6xl font-blank-river !text-black'>Spray Color</p>
          <div className='flex items-center gap-2'>
            {colors.map((color) => (
              <button
                tabIndex={-1}
                key={color}
                className={`size-[54px] rounded-full border-3 ${selectedColor === color ? 'border-white' : 'border-black'} select-none`}
                style={{ backgroundColor: color }}
                onClick={changeColorFn(color)}
              />
            ))}
          </div>
        </div>
        <div className='mt-24 flex justify-end w-full'>
          <button className='hover:scale-110 transition-transform cursor-pointer' onClick={onHide}>
            <img src='/assets/copy/confirm.svg' />
          </button>
        </div>
      </div>
    </div>
  )
}
