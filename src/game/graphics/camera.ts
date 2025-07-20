import { mat4 } from 'gl-matrix';
import { Vector3 } from '../math';
import { Player } from '../player/player';

const ZOOM = 10;

export class Camera {
  private player: Player;
  private up: Vector3;

  public position: Vector3;

  private fov: number = 45 * Math.PI / 180;
  private aspect: number;
  private zNear: number = 0.1;
  private zFar: number = 100.0;

  constructor(aspect: number, player: Player) {
    this.up = new Vector3(0, 1, 0);
    this.position = new Vector3(player.position.x, player.position.y, player.position.z + ZOOM);
    this.aspect = aspect;
    this.player = player;
  }

  update() {
    this.position = new Vector3(
      this.player.position.x,
      this.player.position.y,
      this.player.position.z + ZOOM
    );
  }

  viewMatrix() {
    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, this.position.toReadonlyVec3(), this.player.position.toReadonlyVec3(), this.up.toReadonlyVec3());
    return viewMatrix;
  }

  projectionMatrix() {
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, this.fov, this.aspect, this.zNear, this.zFar);
    return projectionMatrix;
  }
}
