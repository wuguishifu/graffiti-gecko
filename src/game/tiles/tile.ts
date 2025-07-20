import { Mesh, squareMesh } from '../graphics/mesh';
import { RenderObject } from '../graphics/render-object';
import { Texture } from '../graphics/texture';
import { Vector3 } from '../math';

type TileVariant = 'grass' | 'stone' | 'building';

type TileProps = {
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  variant: TileVariant;
  gl: WebGLRenderingContext;
}

const variantToTextureMap: Record<TileVariant, string> = {
  grass: '/assets/tiles/grass.JPG',
  stone: '/assets/tiles/stone.JPG',
  building: '/assets/tiles/building.JPG',
};

export class Tile extends RenderObject {
  public variant: TileVariant;
  public texture: Texture;
  private textureLoaded: boolean = false;

  constructor({ position, rotation, scale, variant, gl }: TileProps) {
    super(position, rotation, scale);
    this.variant = variant;

    this.texture = new Texture(gl);
    this.texture.loadFromImage(variantToTextureMap[variant])
      .then(() => {
        this.textureLoaded = true;
      })
      .catch(console.error);
  }

  public get isTextureReady(): boolean {
    return this.textureLoaded;
  }

  private defaultMesh: Mesh | null = null;
  public mesh(gl: WebGLRenderingContext): Mesh {
    if (!this.defaultMesh) {
      this.defaultMesh = squareMesh(gl);
    }
    return this.defaultMesh;
  }
}
