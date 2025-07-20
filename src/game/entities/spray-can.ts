import type { Camera } from '../graphics/camera';
import { squareMesh, type Mesh } from '../graphics/mesh';
import { RenderObject } from '../graphics/render-object';
import renderObject from '../graphics/renderer';
import { TextureManager } from '../graphics/texture-manager';
import type { ProgramInfo } from '../graphics/types';
import { Vector3 } from '../math';

export class SprayCan extends RenderObject {
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
        texture: this.textureManager.getEntityTexture('spray-can'),
        useTexture: this.textureManager.isEntityTextureReady('spray-can'),
      },
      camera,
    });
  }
}
