import { Texture } from './texture';

type TileVariant = 'grass' | 'stone' | 'building';
type EntityVariant = 'gecko' | 'spray-can' | 'cop';

const tileVariantToTextureMap: Record<TileVariant, string> = {
  grass: '/assets/tiles/grass.jpg',
  stone: '/assets/tiles/stone.jpg',
  building: '/assets/tiles/building.jpg',
};

const entityVariantToTextureMap: Record<EntityVariant, string> = {
  gecko: '/assets/gecko.png',
  'spray-can': '/assets/entities/spray-can.png',
  cop: '/assets/entities/cop.png',
};

export class TextureManager {
  private static instance: TextureManager | null;
  private tileTextures: Map<TileVariant, Texture> = new Map();
  private entityTextures: Map<EntityVariant, Texture> = new Map();
  private tileLoadingPromises: Map<TileVariant, Promise<void>> = new Map();
  private entityLoadingPromises: Map<EntityVariant, Promise<void>> = new Map();
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
      this.loadTileTexture(variant as TileVariant, path)
    );

    await Promise.all(loadPromises);
    console.log('All tile textures preloaded successfully');
  }

  public async preloadEntityTexture(variant: EntityVariant): Promise<void> {
    await this.loadEntityTexture(variant, entityVariantToTextureMap[variant]);
  }

  private async loadTileTexture(variant: TileVariant, path: string): Promise<void> {
    if (this.tileLoadingPromises.has(variant)) {
      return this.tileLoadingPromises.get(variant)!;
    }

    const texture = new Texture(this.gl);
    const loadPromise = texture.loadFromImage(path)
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

  private async loadEntityTexture(variant: EntityVariant, path: string): Promise<void> {
    if (this.entityLoadingPromises.has(variant)) {
      return this.entityLoadingPromises.get(variant)!;
    }

    const texture = new Texture(this.gl);
    const loadPromise = texture.loadFromImage(path)
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
