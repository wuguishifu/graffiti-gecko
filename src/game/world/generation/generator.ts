import { Vector3 } from '@/game/math';
import { Tile } from '@/game/tiles/tile';

export class Generator {
  static createBaseTiles(gl: WebGLRenderingContext, width: number, height: number, tiles: Tile[][]) {
    for (let y = 0; y < height; y++) {
      tiles[y] = [];
      for (let x = 0; x < width; x++) {
        tiles[y][x] = new Tile({
          position: new Vector3(x, y, 0),
          rotation: new Vector3(0, 0, 0),
          scale: new Vector3(1, 1, 1),
          variant: 'grass',
          gl,
        });
      }
    }
  }
}
