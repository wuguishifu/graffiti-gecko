import { useCallback, useRef } from 'react';

import { soundService } from '../game/sound/sound';
import { dataActions } from '../state/data-slice';
import { useAppDispatch, useAppSelector } from '../state/use-app-state';

const colors = ['#FF00D0', '#78D441', '#71FFF3', '#FFF600', '#FF8000'];

export function SettingsMenu({ onHide }: { onHide: () => void }) {
  const dispatch = useAppDispatch();
  const dispatchRef = useRef(dispatch);
  const changeColorFn = useCallback((color: string) => () => dispatchRef.current(dataActions.setSprayColor(color)), []);

  const selectedColor = useAppSelector((state) => state.data.sprayColor);
  const musicVolume = useAppSelector((state) => state.data.musicVolume);
  const soundVolume = useAppSelector((state) => state.data.soundVolume);

  return (
    <div
      className="absolute top-0 right-0 w-full h-full flex items-center justify-center bg-white/20 backdrop-blur-md z-50"
      onClick={onHide}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FD50B4] p-16 rounded-lg flex flex-col items-center"
        style={{
          filter: 'drop-shadow(15px 15px 4px rgba(0, 0, 0, 0.60))',
        }}
      >
        <img src="/assets/copy/settings-title.svg" className="select-none pointer-events-none" />
        <div className="mt-12 flex items-center gap-4 w-full">
          <div className="w-44">
            <img src="/assets/copy/music.svg" className="select-none pointer-events-none" />
          </div>
          <label
            htmlFor="minmax-range"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          ></label>
          <input
            id="minmax-range"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={musicVolume}
            onChange={(e) => dispatch(dataActions.setMusicVolume(Number(e.target.value)))}
            className="flex-1 h-6 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-black"
          />
        </div>

        <div className="mt-12 flex items-center gap-4 w-full">
          <div className="w-44">
            <img src="/assets/copy/sounds.svg" className="select-none pointer-events-none" />
          </div>
          <label
            htmlFor="minmax-range"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          ></label>
          <input
            id="minmax-range"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={soundVolume}
            onChange={(e) => dispatch(dataActions.setSoundVolume(Number(e.target.value)))}
            className="flex-1 h-6 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-black"
          />
        </div>

        <div className="mt-12 flex items-center gap-4 justify-between w-full">
          <img src="/assets/copy/spray-color.svg" className="select-none pointer-events-none" />
          <div className="flex items-center gap-2">
            {colors.map((color) => (
              <button
                tabIndex={-1}
                key={color}
                className={`size-[54px] rounded-full border-3 ${selectedColor === color ? 'border-white' : 'border-black'} select-none cursor-pointer`}
                style={{ backgroundColor: color }}
                onClick={changeColorFn(color)}
              />
            ))}
          </div>
        </div>

        <div className="mt-12 flex items-start gap-4 w-full select-none pointer-events-none">
          <img src="/assets/copy/gameplay.svg" />
          <div className="w-52 bg-[#FFF600] aspect-square border-3 border-black rounded-xl flex flex-col items-center py-2 px-2 justify-evenly">
            <img src="/assets/copy/move.svg" />
            <div className="flex w-full justify-evenly">
              {/* don't judge me this is just so it lines up quick and dirty */}
              <div className="bg-transparent border-3 border-transparent rounded-lg aspect-square size-15"></div>
              <div className="bg-white border-3 border-black rounded-lg aspect-square flex items-center justify-center size-15">
                <span className="font-blank-river !text-black text-4xl">W</span>
              </div>
              <div className="bg-transparent border-3 border-transparent rounded-lg aspect-square size-15"></div>
            </div>
            <div className="flex w-full justify-evenly">
              <div className="bg-white border-3 border-black rounded-lg aspect-square flex items-center justify-center size-15">
                <span className="font-blank-river !text-black text-4xl">A</span>
              </div>
              <div className="bg-white border-3 border-black rounded-lg aspect-square flex items-center justify-center size-15">
                <span className="font-blank-river !text-black text-4xl">S</span>
              </div>
              <div className="bg-white border-3 border-black rounded-lg aspect-square flex items-center justify-center size-15">
                <span className="font-blank-river !text-black text-4xl">D</span>
              </div>
            </div>
          </div>
          <div className="w-52 bg-[#FFF600] aspect-square border-3 border-black rounded-xl flex flex-col items-center py-2 justify-evenly">
            <img src="/assets/copy/start-tag.svg" />
            <img src="/assets/icons/mouse-click.png" className="h-15" />
            <div className="flex justify-center w-full">
              <div className="bg-white border-3 border-black rounded-lg flex items-center justify-center h-15 w-3/4">
                <span className="font-blank-river !text-black text-4xl">Space</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-end w-full">
          <button
            className="hover:scale-110 transition-transform cursor-pointer select-none"
            onMouseEnter={() => soundService.playSound('hover')}
            onClick={() => {
              soundService.playSound('click');
              onHide();
            }}
          >
            <img src="/assets/copy/confirm.svg" />
          </button>
        </div>
      </div>
    </div>
  );
}
