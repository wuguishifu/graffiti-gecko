import type { Camera } from '../graphics/camera';
import type { Mesh } from '../graphics/mesh';
import { RenderObject } from '../graphics/render-object';
import renderObject from '../graphics/renderer';
import type { ProgramInfo } from '../graphics/types';
import { Vector3 } from '../math';
import { Tile } from '../tiles/tile';

export class Player extends RenderObject {
  private mesh: Mesh;

  constructor(gl: WebGLRenderingContext) {
    super(
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0),
      new Vector3(0.5, 0.5, 0.5),
    );

    this.mesh = Tile.mesh(gl);
  }

  public render(gl: WebGLRenderingContext, programInfo: ProgramInfo, camera: Camera) {
    renderObject({
      gl,
      info: programInfo,
      object: {
        mesh: this.mesh,
        model: this.model,
      },
      camera,
    });
  }

  public update() {
    let vx = 0;
    let vy = 0;
    let ax = 0.1;

    if (this.keysDown.has('shift')) ax = 0.2;

    if (this.keysDown.has('w')) vy += ax;
    if (this.keysDown.has('s')) vy -= ax;
    if (this.keysDown.has('a')) vx -= ax;
    if (this.keysDown.has('d')) vx += ax;

    this.position.add(new Vector3(vx, 0, vy));
  }

  private keysDown: Set<string> = new Set();

  public onKeyDown(event: KeyboardEvent) {
    if (this.keysDown.has(event.key.toLowerCase())) return;
    this.keysDown.add(event.key.toLowerCase());
  }

  public onKeyUp(event: KeyboardEvent) {
    this.keysDown.delete(event.key.toLowerCase());
  }
}
