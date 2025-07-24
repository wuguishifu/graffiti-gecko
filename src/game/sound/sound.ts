import { store } from '@/state/store';
import { Howl } from 'howler';

const Sounds = {
  click: new Howl({ src: ['/assets/sounds/menu/button.mp3'], volume: 0.3 }),
  hover: new Howl({ src: ['/assets/sounds/menu/hover.mp3'], volume: 0.3 }),
};

class SoundService {
  public playSound(sound: keyof typeof Sounds) {
    const soundsOn = store.getState().game.soundOn;

    if (soundsOn) {
      Sounds[sound].play();
    }
  }
}

export const soundService = new SoundService();
