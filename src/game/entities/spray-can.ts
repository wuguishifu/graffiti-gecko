import type { Camera } from '../graphics/camera';
import { type Mesh, squareMesh } from '../graphics/mesh';
import { RenderObject } from '../graphics/render-object';
import { renderObject } from '../graphics/renderer';
import { EntityVariant, TextureManager } from '../graphics/texture-manager';
import type { ProgramInfo } from '../graphics/types';
import { Vector3 } from '../math';

export type SprayCanState = 'available' | 'completed' | 'failed';

export class SprayCan extends RenderObject {
  private mesh: Mesh;
  private textureManager: TextureManager;
  public id: number;
  public isCompleted = false;
  public state: SprayCanState;

  constructor(gl: WebGLRenderingContext, id: number) {
    super(new Vector3(0, 0, 0), new Vector3(0, 0, Math.PI), new Vector3(1, 1, 1));

    this.state = 'available';
    this.mesh = squareMesh(gl);
    this.id = id;
    this.textureManager = TextureManager.getInstance(gl);
  }

  private get textureKey(): EntityVariant {
    switch (this.state) {
      case 'available':
        return 'spray-can';
      case 'completed':
        return 'spray-can-completed';
      case 'failed':
        return 'spray-can-failed';
      default:
        return 'spray-can';
    }
  }

  public render(gl: WebGLRenderingContext, programInfo: ProgramInfo, camera: Camera) {
    const textureKey = this.textureKey;

    renderObject({
      gl,
      info: programInfo,
      object: {
        mesh: this.mesh,
        model: this.model,
        texture: this.textureManager.getEntityTexture(textureKey),
        useTexture: this.textureManager.isEntityTextureReady(textureKey),
      },
      camera,
    });
  }
}
