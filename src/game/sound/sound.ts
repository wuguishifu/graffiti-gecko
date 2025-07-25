import { Howl } from 'howler';

import { store } from '@/state/store';

const Sounds = {
  click: new Howl({ src: ['/assets/sounds/menu/button.mp3'], volume: 0.3 }),
  hover: new Howl({ src: ['/assets/sounds/menu/hover.mp3'], volume: 0.3 }),
  hit: new Howl({ src: ['/assets/sounds/menu/hit.mp3'], volume: 0.3 }),
  caught: new Howl({ src: ['/assets/sounds/menu/caught.wav'], volume: 0.3 }),
};

class SoundService {
  public playSound(sound: keyof typeof Sounds) {
    const soundsOn = store.getState().session.soundOn;

    if (soundsOn) {
      Sounds[sound].play();
    }
  }
}

export const soundService = new SoundService();
