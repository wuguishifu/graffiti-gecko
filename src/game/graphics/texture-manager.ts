import { Texture } from './texture';
import { TileVariant } from '../tiles/types';

type EntityVariant = 'gecko' | 'spray-can' | 'cop';

const tileVariantToTextureMap: Record<TileVariant, string> = {
  grass: '/assets/tiles/grass.jpg',
  stone: '/assets/tiles/stone.jpg',
  building: '/assets/tiles/building.jpg',
  sand: '/assets/tiles/sand.jpg',
  vent: '/assets/tiles/vent.jpg',
};

const entityVariantToTextureMap: Record<EntityVariant, string> = {
  gecko: '/assets/gecko.png',
  'spray-can': '/assets/entities/spray-can.png',
  cop: '/assets/entities/cop.png',
};

export class TextureManager {
  private static instance: TextureManager | null;
  private tileTextures = new Map<TileVariant, Texture>();
  private entityTextures = new Map<EntityVariant, Texture>();
  private tileLoadingPromises = new Map<TileVariant, Promise<void>>();
  private entityLoadingPromises = new Map<EntityVariant, Promise<void>>();
  private gl: WebGLRenderingContext;

  private constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
  }

  public static getInstance(gl: WebGLRenderingContext): TextureManager {
    if (!TextureManager.instance) {
      TextureManager.instance = new TextureManager(gl);
    }
    return TextureManager.instance;
  }

  public async preloadAllTileTextures(): Promise<void> {
    const loadPromises = Object.entries(tileVariantToTextureMap).map(([variant, path]) =>
      this.loadTileTexture(variant as TileVariant, path),
    );

    await Promise.all(loadPromises);
    console.log('All tile textures preloaded successfully');
  }

  public async preloadEntityTexture(variant: EntityVariant): Promise<void> {
    await this.loadEntityTexture(variant, entityVariantToTextureMap[variant]);
  }

  private loadTileTexture(variant: TileVariant, path: string): Promise<void> {
    const promise = this.tileLoadingPromises.get(variant);
    if (promise) {
      return promise;
    }

    const texture = new Texture(this.gl);
    const loadPromise = texture
      .loadFromImage(path)
      .then(() => {
        this.tileTextures.set(variant, texture);
        console.log(`Tile texture loaded: ${variant}`);
      })
      .catch((error) => {
        console.error(`Failed to load tile texture ${variant}:`, error);
        throw error;
      });

    this.tileLoadingPromises.set(variant, loadPromise);
    return loadPromise;
  }

  private loadEntityTexture(variant: EntityVariant, path: string): Promise<void> {
    const promise = this.entityLoadingPromises.get(variant);
    if (promise) {
      return promise;
    }

    const texture = new Texture(this.gl);
    const loadPromise = texture
      .loadFromImage(path)
      .then(() => {
        this.entityTextures.set(variant, texture);
        console.log(`Entity texture loaded: ${variant}`);
      })
      .catch((error) => {
        console.error(`Failed to load entity texture ${variant}:`, error);
        throw error;
      });

    this.entityLoadingPromises.set(variant, loadPromise);
    return loadPromise;
  }

  public getTileTexture(variant: TileVariant): Texture | undefined {
    return this.tileTextures.get(variant);
  }

  public getEntityTexture(variant: EntityVariant): Texture | undefined {
    return this.entityTextures.get(variant);
  }

  public isTileTextureReady(variant: TileVariant): boolean {
    return this.tileTextures.has(variant);
  }

  public isEntityTextureReady(variant: EntityVariant): boolean {
    return this.entityTextures.has(variant);
  }

  public getAllTileVariants(): TileVariant[] {
    return Object.keys(tileVariantToTextureMap) as TileVariant[];
  }

  public destroy(): void {
    // Clean up all textures
    for (const texture of this.tileTextures.values()) {
      texture.destroy();
    }
    for (const texture of this.entityTextures.values()) {
      texture.destroy();
    }

    // Clear maps
    this.tileTextures.clear();
    this.entityTextures.clear();
    this.tileLoadingPromises.clear();
    this.entityLoadingPromises.clear();
  }

  public static resetInstance(): void {
    if (TextureManager.instance) {
      TextureManager.instance.destroy();
      TextureManager.instance = null;
    }
  }
}
