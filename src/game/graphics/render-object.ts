import { Vector3 } from '../math';

export class RenderObject {
  public position: Vector3;
  public rotation: Vector3;
  public scale: Vector3;

  constructor(
    position: Vector3 = new Vector3(0, 0, 0),
    rotation: Vector3 = new Vector3(0, 0, 0),
    scale: Vector3 = new Vector3(1, 1, 1)
  ) {
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
  }

  public get model() {
    return {
      position: this.position,
      rotation: this.rotation,
      scale: this.scale
    };
  }
}
