import type { Camera } from '../graphics/camera';
import { Mesh, squareMesh } from '../graphics/mesh';
import { RenderObject } from '../graphics/render-object';
import { renderObject, renderSimilarObjects } from '../graphics/renderer';
import { TextureManager } from '../graphics/texture-manager';
import type { ProgramInfo } from '../graphics/types';
import { Vector3 } from '../math';
import { TileVariant } from './types';

type TileProps = {
  position: Vector3;
  rotation?: Vector3;
  scale?: Vector3;
  variant: TileVariant;
  gl: WebGLRenderingContext;
}

export class Tile extends RenderObject {
  public variant: TileVariant;
  private textureManager: TextureManager;

  constructor({ position, rotation, scale, variant, gl }: TileProps) {
    super(position, rotation, scale);
    this.variant = variant;
    this.textureManager = TextureManager.getInstance(gl);
  }

  public get texture() {
    return this.textureManager.getTileTexture(this.variant);
  }

  public get isTextureReady(): boolean {
    return this.textureManager.isTileTextureReady(this.variant);
  }

  private defaultMesh: Mesh | null = null;
  public mesh(gl: WebGLRenderingContext): Mesh {
    if (!this.defaultMesh) {
      this.defaultMesh = squareMesh(gl);
    }
    return this.defaultMesh;
  }

  public render(gl: WebGLRenderingContext, programInfo: ProgramInfo, camera: Camera) {
    renderObject({
      gl,
      info: programInfo,
      object: {
        mesh: this.mesh(gl),
        model: this.model,
        texture: this.texture,
        useTexture: this.isTextureReady,
      },
      camera,
    });
  }

  public static renderVariantGroup(gl: WebGLRenderingContext, programInfo: ProgramInfo, camera: Camera, tiles: Tile[]) {
    const firstTile = tiles[0];
    if (!firstTile) {
      return;
    }

    renderSimilarObjects({
      gl,
      info: programInfo,
      objects: tiles.map(tile => ({ model: tile.model })),
      mesh: firstTile.mesh(gl),
      camera,
      texture: firstTile.texture,
      useTexture: firstTile.isTextureReady,
    })
  }
}
