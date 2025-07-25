import { Howl } from 'howler';

import { store } from '@/state/store';

const Sounds = {
  click: new Howl({ src: ['/assets/sounds/button.mp3'], volume: 0.3 }),
  hover: new Howl({ src: ['/assets/sounds/hover.mp3'], volume: 0.3 }),
  hit: new Howl({ src: ['/assets/sounds/hit.mp3'], volume: 0.3 }),
  caught: new Howl({ src: ['/assets/sounds/caught.wav'], volume: 0.3 }),
  policeWalk: new Howl({ src: ['/assets/sounds/police_walk.mp3'], volume: 0.3, loop: true }),
  spray: new Howl({ src: ['/assets/sounds/spray.mp3'], volume: 0.3, loop: true }),
  success: new Howl({ src: ['/assets/sounds/success.mp3'], volume: 0.3 }),
  mainMenu: new Howl({ src: ['/assets/sounds/music/main_menu.mp3'], volume: 0.3 }),
  game1: new Howl({ src: ['/assets/sounds/music/game1.mp3'], volume: 0.3 }),
  game2: new Howl({ src: ['/assets/sounds/music/game2.mp3'], volume: 0.3 }),
  game3: new Howl({ src: ['/assets/sounds/music/game3.mp3'], volume: 0.3 }),
  game4: new Howl({ src: ['/assets/sounds/music/game4.mp3'], volume: 0.3 }),
};

const gameMusicKeys: (keyof typeof Sounds)[] = ['game1', 'game2', 'game3', 'game4'];

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

  public randomGameMusicKey(): keyof typeof Sounds {
    const randomIndex = Math.floor(Math.random() * gameMusicKeys.length);
    return gameMusicKeys[randomIndex];
  }
}

export const soundService = new SoundService();
