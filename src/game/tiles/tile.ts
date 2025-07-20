import { Mesh, squareMesh } from '../graphics/mesh';
import { RenderObject } from '../graphics/render-object';
import { TextureManager } from '../graphics/texture-manager';
import { Texture } from '../graphics/texture';
import { Vector3 } from '../math';

type TileVariant = 'grass' | 'stone' | 'building';

type TileProps = {
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  variant: TileVariant;
  gl: WebGLRenderingContext;
  neighbors?: {
    north?: TileVariant;
    south?: TileVariant;
    east?: TileVariant;
    west?: TileVariant;
  };
}

export class Tile extends RenderObject {
  public variant: TileVariant;
  private textureManager: TextureManager;
  private neighbors: {
    north?: TileVariant;
    south?: TileVariant;
    east?: TileVariant;
    west?: TileVariant;
  };

  constructor({ position, rotation, scale, variant, gl, neighbors = {} }: TileProps) {
    super(position, rotation, scale);
    this.variant = variant;
    this.neighbors = neighbors;
    this.textureManager = TextureManager.getInstance(gl);
  }

  public get primaryTexture() {
    return this.textureManager.getTileTexture(this.variant);
  }

  public get blendTextures() {
    const textures: { texture: Texture; weight: number }[] = [];

    // Add primary texture with full weight
    const primaryTex = this.primaryTexture;
    if (primaryTex) {
      textures.push({ texture: primaryTex, weight: 1.0 });
    }

    // Add neighbor textures for blending
    const neighborVariants = Object.values(this.neighbors).filter(Boolean) as TileVariant[];
    const uniqueNeighbors = [...new Set(neighborVariants)];

    uniqueNeighbors.forEach(neighborVariant => {
      if (neighborVariant !== this.variant) {
        const neighborTexture = this.textureManager.getTileTexture(neighborVariant);
        if (neighborTexture) {
          // Calculate blend weight based on number of neighbors of this type
          const count = neighborVariants.filter(v => v === neighborVariant).length;
          const weight = Math.min(count * 0.25, 0.5); // Max 50% blend
          textures.push({ texture: neighborTexture, weight });
        }
      }
    });

    return textures;
  }

  public get isTextureReady(): boolean {
    return this.textureManager.isTileTextureReady(this.variant);
  }

  public updateNeighbors(neighbors: {
    north?: TileVariant;
    south?: TileVariant;
    east?: TileVariant;
    west?: TileVariant;
  }) {
    this.neighbors = neighbors;
  }

  private defaultMesh: Mesh | null = null;
  public mesh(gl: WebGLRenderingContext): Mesh {
    if (!this.defaultMesh) {
      this.defaultMesh = squareMesh(gl);
    }
    return this.defaultMesh;
  }
}
