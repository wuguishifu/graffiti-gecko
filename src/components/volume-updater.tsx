import { useEffect } from 'react';

import { soundService } from '../game/sound/sound';
import { useAppSelector } from '../state/use-app-state';

const musicKeys = ['mainMenu', 'game1', 'game2', 'game3', 'game4'];

export function VolumeUpdater() {
  const musicVolume = useAppSelector((state) => state.data.musicVolume);
  const soundVolume = useAppSelector((state) => state.data.soundVolume);

  useEffect(() => {
    const loopIds = soundService.loopIds;
    Object.entries(loopIds).forEach(([key]) => {
      if (musicKeys.includes(key)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        soundService.changeVolume(key as any, musicVolume);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        soundService.changeVolume(key as any, soundVolume);
      }
    });
  }, [musicVolume, soundVolume]);

  return null;
}
