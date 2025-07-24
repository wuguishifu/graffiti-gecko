import { Howl } from 'howler';

export const Sounds = {
  click: new Howl({ src: ['/assets/sounds/menu/button.mp3'], volume: 0.3 }),
  hover: new Howl({ src: ['/assets/sounds/menu/hover.mp3'], volume: 0.3 }),
};