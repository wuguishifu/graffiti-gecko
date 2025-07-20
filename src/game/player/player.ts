import type { Camera } from '../graphics/camera';
import { squareMesh, type Mesh } from '../graphics/mesh';
import { RenderObject } from '../graphics/render-object';
import renderObject from '../graphics/renderer';
import { TextureManager } from '../graphics/texture-manager';
import type { ProgramInfo } from '../graphics/types';
import { Vector3 } from '../math';

export class Player extends RenderObject {
  private mesh: Mesh;
  private textureManager: TextureManager;

  constructor(gl: WebGLRenderingContext) {
    super(
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0),
      new Vector3(1, 1, 1),
    );

    this.mesh = squareMesh(gl);
    this.textureManager = TextureManager.getInstance(gl);
  }

  public render(gl: WebGLRenderingContext, programInfo: ProgramInfo, camera: Camera) {
    renderObject({
      gl,
      info: programInfo,
      object: {
        mesh: this.mesh,
        model: this.model,
        texture: this.textureManager.getEntityTexture('gecko'),
        useTexture: this.textureManager.isEntityTextureReady('gecko'),
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

    if (ax === 0 && vy === 0) return;
    this.position.add(new Vector3(vx, 0, vy));
    this.rotation.y = Math.atan2(vx, vy);
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
