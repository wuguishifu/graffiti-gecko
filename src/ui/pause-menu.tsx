import { useState } from 'react';
import { Link } from 'react-router';

import { SettingsMenu } from './settings-menu';
import { soundService } from '../game/sound/sound';
import { gameActions } from '../state/game-slice';
import { useAppDispatch, useAppSelector } from '../state/use-app-state';
import { secondsToTimeString } from '../util/time-utils';

import { Timer } from '@/components/timer';

export function PauseMenu() {
  const [settingsVisible, setSettingsVisible] = useState(false);

  const currentLevel = useAppSelector((state) => state.game.currentLevel);
  const timeLeft = useAppSelector((state) => state.game.timeLeft);
  const tagsCompleted = useAppSelector((state) => state.game.totalSprayCansCompleted);

  const dispatch = useAppDispatch();

  const totalDuration = useAppSelector((state) => state.dev.overrideTotalTime || 300);

  soundService.stopSound('policeWalk');

  return (
    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-50 bg-black select-none">
      <img
        className="absolute top-0 left-0 w-full h-full object-cover -z-20 pointer-events-none"
        src="/assets/backgrounds/wall.webp"
      />
      <img className="absolute h-[90%] select-none pointer-events-none -z-10" src="/assets/tags/spray-bg.webp" />
      <div className="flex flex-col items-center gap-8">
        <img src="/assets/copy/game-paused.svg" className="pointer-events-none" />
        <p className="text-6xl font-graffiti-youth !text-black">Level {currentLevel}</p>
        <div className="flex flex-row items-center gap-32 w-[50rem] h-38">
          <Pill>
            <p className="text-7xl font-graffiti-youth !text-black">{tagsCompleted}</p>
            <div className="absolute -left-20 -top-14">
              <img src="/assets/icons/can.png" className="size-48 pointer-events-none select-none" />
            </div>
          </Pill>
          <Pill>
            <p className="text-7xl font-graffiti-youth !text-black">{secondsToTimeString(timeLeft)}</p>
            <div className="absolute -left-12">
              <Timer remainingDurationSeconds={timeLeft} totalDurationSeconds={totalDuration} strokeWidth={3} />
            </div>
          </Pill>
        </div>
        <button
          className="hover:scale-110 transition-transform cursor-pointer"
          onMouseEnter={() => soundService.playSound('hover')}
          onClick={() => {
            soundService.playSound('click');
            dispatch(gameActions.setPauseMenuVisible(false));
          }}
        >
          <img src="/assets/copy/resume.svg" />
        </button>
        <button
          className="hover:scale-110 transition-transform cursor-pointer"
          onMouseEnter={() => soundService.playSound('hover')}
          onClick={() => {
            setSettingsVisible(true);
            soundService.playSound('click');
          }}
        >
          <img src="/assets/copy/pause-menu-settings.svg" />
        </button>
        <Link
          to="/"
          className="hover:scale-110 transition-transform"
          onMouseEnter={() => soundService.playSound('hover')}
          onClick={() => {
            soundService.playSound('click');
          }}
        >
          <img src="/assets/copy/exit-to-main-menu.svg" />
        </Link>
      </div>
      {settingsVisible && <SettingsMenu onHide={() => setSettingsVisible(false)} />}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#78D441] rounded-full border-[3px] border-black flex-1 flex items-center justify-center relative py-4">
      {children}
    </div>
  );
}
