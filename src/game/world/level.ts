import { gameActions } from '../../state/game-slice';
import { store } from '../../state/store';
import { Cop } from '../entities/cop';
import { SprayCan } from '../entities/spray-can';
import type { Camera } from '../graphics/camera';
import type { ProgramInfo } from '../graphics/types';
import { Vector3 } from '../math';
import type { Player } from '../player/player';
import { Tile } from '../tiles/tile';

type TileType = 'grass' | 'stone' | 'building';

interface Cell {
  x: number;
  y: number;
  possibleTiles: Set<TileType>;
  collapsed: boolean;
  finalTile?: TileType;
}

const walkableTiles: TileType[] = ['grass', 'stone'];

// Define adjacency rules for city blocks
const rules: Record<TileType, TileType[]> = {
  grass: ['stone', 'grass'], // Grass can be next to grass or stone (parks)
  stone: ['grass', 'building', 'stone'], // Stone can be next to anything (roads)
  building: ['stone', 'building'] // Building can be next to stone or building (city blocks)
};

// Add weights to favor larger city blocks
const tileWeights: Record<TileType, number> = {
  grass: 0.2,    // Less common - parks
  stone: 0.3,    // Roads
  building: 0.5  // Most common - buildings
};

export class Level {
  private gl: WebGLRenderingContext;
  private tiles: Tile[][] = [];
  private width = 30;
  private height = 30;
  private sprayCans: SprayCan[] = [];
  private cops: Cop[] = [];
  private player: Player | null = null;
  private difficultyLevel: number = 1;

  constructor(gl: WebGLRenderingContext, difficultyLevel: number = 1) {
    this.gl = gl;
    this.difficultyLevel = difficultyLevel;
    this.generate();
  }

  public setPlayer(player: Player) {
    this.player = player;
    // Spawn cops after player is set
    this.spawnCops();
  }

  public generate() {
    this.tiles = [];
    this.sprayCans = [];
    this.cops = [];

    // Generate tiles based on difficulty level
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x] = new Tile({
          position: new Vector3(x, y, 0),
          rotation: new Vector3(0, 0, 0),
          scale: new Vector3(1, 1, 1),
          variant: 'grass',
          gl: this.gl
        });
      }
    }

    // Spawn spray cans in the generated level
    this.spawnSprayCans();
  }

  public getTiles(): Tile[][] {
    return this.tiles;
  }

  public render(gl: WebGLRenderingContext, programInfo: ProgramInfo, camera: Camera) {
    this.tiles.forEach(row => {
      row.forEach(tile => {
        tile.render(gl, programInfo, camera);
      });
    });

    // Render spray cans
    this.sprayCans.forEach(sprayCan => {
      sprayCan.render(gl, programInfo, camera);
    });

    // Render cops
    this.cops.forEach(cop => {
      cop.render(gl, programInfo, camera);
    });
  }

  // Add this new method to check if a position is walkable
  public isWalkable(x: number, y: number): boolean {
    // Check bounds
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return false;
    }

    // Check if tile exists at this position
    const tile = this.tiles[y]?.[x];
    if (!tile) {
      return false;
    }

    // Define which tile types are walkable
    return walkableTiles.includes(tile.variant);
  }

  // Add a method to get tile type at position (useful for debugging)
  public getTileType(x: number, y: number): TileType | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }

    const tile = this.tiles[y]?.[x];
    return tile ? tile.variant : null;
  }

  private spawnSprayCans() {
    this.sprayCans = [];
    const spawnPoints = this.findBuildingRoadIntersections();

    // Scale number of spray cans based on difficulty
    // Level 1: 3-5 spray cans, Level 2: 4-6, Level 3: 5-7, etc.
    const baseSprayCans = Math.floor(Math.random() * 2) + 1; // 1-2 base spray cans
    const difficultyBonus = Math.min(this.difficultyLevel - 1, 5); // Cap at +5 for balance
    const numSprayCans = baseSprayCans + difficultyBonus;

    const shuffledPoints = [...spawnPoints].sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(numSprayCans, shuffledPoints.length); i++) {
      const point = shuffledPoints[i];
      const sprayCan = new SprayCan(this.gl, i);
      sprayCan.position.x = point.x;
      sprayCan.position.y = point.y;
      sprayCan.position.z = 0.1; // Slightly above ground
      this.sprayCans.push(sprayCan);
    }

    store.dispatch(gameActions.setSprayCans(this.sprayCans.map(sprayCan => sprayCan.id)));

    console.log(`Spawned ${this.sprayCans.length} spray cans at building-road intersections (Level ${this.difficultyLevel})`);
  }

  private findBuildingRoadIntersections(): { x: number; y: number }[] {
    const intersections: { x: number; y: number }[] = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const currentTile = this.getTileType(x, y);

        if (currentTile === 'stone') {
          // Check if this road tile is adjacent to a building
          const neighbors = this.getNeighborTiles(x, y);
          const hasBuildingNeighbor = neighbors.some(tile => tile === 'building');

          if (hasBuildingNeighbor) {
            intersections.push({ x, y });
          }
        }
      }
    }

    return intersections;
  }

  private getNeighborTiles(x: number, y: number): TileType[] {
    const neighbors: TileType[] = [];
    const directions = [
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 }
    ];

    for (const { dx, dy } of directions) {
      const nx = x + dx;
      const ny = y + dy;
      const tileType = this.getTileType(nx, ny);
      if (tileType) {
        neighbors.push(tileType);
      }
    }

    return neighbors;
  }

  public getSprayCans(): SprayCan[] {
    return this.sprayCans;
  }

  private spawnCops() {
    this.cops = [];

    if (!this.player) {
      console.warn('Cannot spawn cops: player not set');
      return;
    }

    // Find suitable spawn points (stone tiles away from player)
    const spawnPoints: { x: number; y: number }[] = [];
    const playerX = Math.round(this.player.position.x);
    const playerY = Math.round(this.player.position.y);
    const minDistanceFromPlayer = 8;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tileType = this.getTileType(x, y);
        if (tileType === 'stone') {
          const distanceFromPlayer = Math.sqrt(
            Math.pow(x - playerX, 2) + Math.pow(y - playerY, 2)
          );
          if (distanceFromPlayer >= minDistanceFromPlayer) {
            spawnPoints.push({ x, y });
          }
        }
      }
    }

    // Scale number of cops based on difficulty
    // Level 1: 2-4 cops, Level 2: 3-5, Level 3: 4-6, etc.
    const baseCops = Math.floor(Math.random() * 2) + 1; // 1-2 base cops
    const difficultyBonus = Math.min(this.difficultyLevel - 1, 4); // Cap at +4 for balance
    const numCops = baseCops + difficultyBonus;

    const shuffledPoints = [...spawnPoints].sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(numCops, shuffledPoints.length); i++) {
      const point = shuffledPoints[i];
      const cop = new Cop(this.gl, this, this.player, i, point.x, point.y, this.difficultyLevel);
      cop.position.z = 0.1; // Slightly above ground
      this.cops.push(cop);
    }

    // Set other cops reference for collision avoidance
    this.cops.forEach(cop => {
      cop.setOtherCops(this.cops.filter(c => c !== cop));
    });

    console.log(`Spawned ${this.cops.length} cops at stone locations (Level ${this.difficultyLevel})`);
  }

  public updateCops() {
    this.cops.forEach(cop => {
      cop.update();
    });
  }

  public getCops(): Cop[] {
    return this.cops;
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  public destroy(): void {
    this.tiles = [];
    this.sprayCans = [];
    this.cops = [];
  }
}
