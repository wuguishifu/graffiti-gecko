import { Mesh, squareMesh } from '../graphics/mesh';
import { RenderObject } from '../graphics/render-object';
import { TextureManager } from '../graphics/texture-manager';
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

  public get secondaryTexture() {
    // Find the most common neighbor type for blending
    const neighborCounts = new Map<TileVariant, number>();

    Object.values(this.neighbors).forEach(neighbor => {
      if (neighbor && neighbor !== this.variant) {
        neighborCounts.set(neighbor, (neighborCounts.get(neighbor) || 0) + 1);
      }
    });

    if (neighborCounts.size === 0) {
      return this.primaryTexture; // No blending needed
    }

    // Get the most common neighbor
    let mostCommonNeighbor: TileVariant | null = null;
    let maxCount = 0;

    for (const [neighbor, count] of neighborCounts) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonNeighbor = neighbor;
      }
    }

    return mostCommonNeighbor ? this.textureManager.getTileTexture(mostCommonNeighbor) : this.primaryTexture;
  }

  public get blendFactor(): number {
    // Calculate blend factor based on how many neighbors are different
    const differentNeighbors = Object.values(this.neighbors).filter(
      neighbor => neighbor && neighbor !== this.variant
    ).length;

    // Normalize to 0-1 range, with max blend at 0.7
    return Math.min(differentNeighbors * 0.25, 0.7);
  }

  public get tilePosition(): [number, number] {
    // Extract tile position from world position for noise seeding
    return [this.position.x, this.position.z];
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
