import { Howl } from 'howler';

import { store } from '@/state/store';

const Sounds = {
  click: new Howl({ src: ['/assets/sounds/menu/button.mp3'], volume: 0.3 }),
  hover: new Howl({ src: ['/assets/sounds/menu/hover.mp3'], volume: 0.3 }),
  hit: new Howl({ src: ['/assets/sounds/menu/hit.mp3'], volume: 0.3 }),
  caught: new Howl({ src: ['/assets/sounds/menu/caught.wav'], volume: 0.3 }),
  policeWalk: new Howl({ src: ['/assets/sounds/menu/police_walk.mp3'], volume: 0.3, loop: true }),
  spray: new Howl({ src: ['/assets/sounds/menu/spray.mp3'], volume: 0.3, loop: true }),
  success: new Howl({ src: ['/assets/sounds/menu/success.mp3'], volume: 0.3 }),
};

class SoundService {
  private loopIds: Partial<Record<keyof typeof Sounds, number>> = {};

  public playSound(key: keyof typeof Sounds, volume = 0.3, loop = false) {
    if (!store.getState().session.soundOn) {
      return;
    }
    const howl = Sounds[key];

    if (loop) {
      let id = this.loopIds[key];
      if (id == null) {
        id = howl.play();
        this.loopIds[key] = id;
      }
      if (volume != null) {
        howl.volume(volume, id);
      }
    } else {
      const id = howl.play();
      if (volume != null) {
        howl.volume(volume, id);
      }
    }
  }

  public stopSound(key: keyof typeof Sounds) {
    const id = this.loopIds[key];
    if (id != null) {
      Sounds[key].stop(id);
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete this.loopIds[key];
    }
  }
}

export const soundService = new SoundService();
