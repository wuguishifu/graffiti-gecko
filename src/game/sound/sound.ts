import { Howl } from 'howler';

import { store } from '@/state/store';

const Sounds = {
  click: new Howl({ src: ['/assets/sounds/button.mp3'] }),
  hover: new Howl({ src: ['/assets/sounds/hover.mp3'] }),
  hit: new Howl({ src: ['/assets/sounds/hit.mp3'] }),
  caught: new Howl({ src: ['/assets/sounds/caught.wav'] }),
  policeWalk: new Howl({ src: ['/assets/sounds/police_walk.mp3'] }),
  spray: new Howl({ src: ['/assets/sounds/spray.mp3'] }),
  success: new Howl({ src: ['/assets/sounds/success.mp3'] }),
  fail: new Howl({ src: ['/assets/sounds/fail.mp3'] }),
  mainMenu: new Howl({ src: ['/assets/sounds/music/main_menu.mp3'] }),
  game1: new Howl({ src: ['/assets/sounds/music/game1.mp3'] }),
  game2: new Howl({ src: ['/assets/sounds/music/game2.mp3'] }),
  game3: new Howl({ src: ['/assets/sounds/music/game3.mp3'] }),
  game4: new Howl({ src: ['/assets/sounds/music/game4.mp3'] }),
};

const gameMusicKeys: (keyof typeof Sounds)[] = ['game1', 'game2', 'game3', 'game4'];

class SoundService {
  public loopIds: Partial<Record<keyof typeof Sounds, number>> = {};

  public playSound(key: keyof typeof Sounds, volume = 1, loop = false) {
    if (!store.getState().session.soundOn) {
      return;
    }
    const howl = Sounds[key];
    const soundPreference = ['mainMenu', 'game1', 'game2', 'game3', 'game4'].includes(key)
      ? store.getState().data.musicVolume
      : store.getState().data.soundVolume;

    const finalVolume = volume * soundPreference;

    if (loop) {
      let id = this.loopIds[key];
      if (id == null) {
        id = howl.play();
        this.loopIds[key] = id;
      }
      if (volume != null) {
        howl.volume(finalVolume, id);
      }
    } else {
      const id = howl.play();
      if (volume != null) {
        howl.volume(finalVolume, id);
      }
    }
  }

  public changeVolume(key: keyof typeof Sounds, volume: number) {
    const howl = Sounds[key];
    const id = this.loopIds[key];
    if (id == null) {
      return;
    }
    howl.volume(volume, id);
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
