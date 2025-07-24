import { DevSliceState } from '@/state/dev-slice';
import { gameActions } from '../../state/game-slice';
import { store } from '../../state/store';
import { Cop } from '../entities/cop';
import { SprayCan } from '../entities/spray-can';
import type { Camera } from '../graphics/camera';
import type { ProgramInfo } from '../graphics/types';
import { Vector3 } from '../math';
import type { Player } from '../player/player';
import { Tile, TileVariant } from '../tiles/tile';

type TileType = 'grass' | 'stone' | 'building';

const walkableTiles: TileType[] = ['grass', 'stone'];

export class Level {
  private gl: WebGLRenderingContext;
  private tiles: Tile[][] = [];
  private width = 30;
  private height = 30;
  private sprayCans: SprayCan[] = [];
  private cops: Cop[] = [];
  private player: Player | null = null;
  private difficultyLevel: number = 1;

  constructor(gl: WebGLRenderingContext, difficultyLevel: number = 1, private devOptions: Partial<DevSliceState>) {
    this.gl = gl;
    this.difficultyLevel = difficultyLevel;
    this.generate();
  }

  public setPlayer(player: Player) {
    this.player = player;
  }

  public spawnEntities() {
    if (!this.player) {
      return;
    }

    const accessibleTiles = new Set<Tile>();
    const accessibleWalls: { x: number; y: number }[] = [];
    this.DFS(this.player.position.x, this.player.position.y, accessibleTiles, accessibleWalls);

    this.spawnSprayCans(accessibleWalls);
    this.spawnCops(this.player, accessibleTiles);
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
    this.growStone(15, 15, 300); // Start at (15,15), grow up to 300 tiles
    this.generateWall()
  }


  public growStone(startX: number, startY: number, maxGrowth: number) {
    const stoneTiles = new Set<string>();
    const activeTips: [number, number][] = [[startX, startY]]; // branch tips

    const key = (x: number, y: number) => `${x},${y}`;

    const inBounds = (x: number, y: number) =>
      x >= 0 && x < this.width && y >= 0 && y < this.height;

    const getNeighbors = (x: number, y: number) => {
      return [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1]
      ].filter(([nx, ny]) => inBounds(nx, ny) && !stoneTiles.has(key(nx, ny)));
    };

    // Start with first tile
    stoneTiles.add(key(startX, startY));
    this.tiles[startY][startX].variant = 'stone';
    let grown = 1;

    while (activeTips.length > 0 && grown < maxGrowth) {
      const [x, y] = activeTips.shift()!;

      const neighbors = getNeighbors(x, y);
      if (neighbors.length === 0) continue;

      // Choose one random direction to grow like a branch
      const [nx, ny] = neighbors[Math.floor(Math.random() * neighbors.length)];

      // Grow to new tile
      stoneTiles.add(key(nx, ny));
      this.tiles[ny][nx].variant = 'stone';
      grown++;

      // Continue growing from the new tip
      activeTips.push([nx, ny]);

      //Optionally: occasionally split the branch
      if (Math.random() < 0.1 && neighbors.length > 1) {
        const other = neighbors.find(([ox, oy]) => key(ox, oy) !== key(nx, ny));
        if (other) activeTips.push(other as [number, number]);
      }
    }
  }

  public generateWall() {
    // 8 directions: orthogonal + diagonal
    const directions = [
      [0, 1],    // down
      [1, 0],    // right
      [0, -1],   // up
      [-1, 0],   // left
      [1, 1],    // bottom-right
      [1, -1],   // top-right
      [-1, 1],   // bottom-left
      [-1, -1]   // top-left
    ];

    const perimeterSet = new Set<string>();

    const key = (x: number, y: number) => `${x},${y}`;
    const inBounds = (x: number, y: number) =>
      x >= 0 && x < this.width && y >= 0 && y < this.height;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y]?.[x];
        if (tile?.variant === 'stone') {
          for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            if (inBounds(nx, ny)) {
              const neighbor = this.tiles[ny]?.[nx];
              if (!neighbor || neighbor.variant !== 'stone') {
                perimeterSet.add(key(nx, ny));
              }
            }
          }
        }
      }
    }

    for (const pos of perimeterSet) {
      const [xStr, yStr] = pos.split(',');
      const x = parseInt(xStr, 10);
      const y = parseInt(yStr, 10);

      if (!this.tiles[y]) this.tiles[y] = [];

      this.tiles[y][x] = new Tile({
        position: new Vector3(x, y, 0),
        rotation: new Vector3(0, 0, 0),
        scale: new Vector3(1, 1, 1),
        variant: 'building',
        gl: this.gl
      });
    }
  }

  public getRandomStoneTile(): Vector3 | null {
    const stoneTiles: Tile[] = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y]?.[x];
        if (tile?.variant === 'stone') {
          stoneTiles.push(tile);
        }
      }
    }

    if (stoneTiles.length === 0) return null;

    const index = Math.floor(Math.random() * stoneTiles.length);
    const tile = stoneTiles[index];

    return Vector3.from(tile.position)
  }


  public getTiles(): Tile[][] {
    return this.tiles;
  }

  public render(gl: WebGLRenderingContext, programInfo: ProgramInfo, camera: Camera) {
    const tileGroups = this.tiles.reduce<Record<TileVariant, Tile[]>>((acc, row) => {
      row.forEach(tile => {
        if (!tile) return
        if (!acc[tile.variant]) {
          acc[tile.variant] = [];
        }
        acc[tile.variant].push(tile);
      });

      return acc;
    }, {
      grass: [],
      stone: [],
      building: []
    });

    Object.values(tileGroups).forEach((tiles) => {
      Tile.renderVariantGroup(gl, programInfo, camera, tiles);
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

  public getTile(x: number, y: number): Tile | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }

    return this.tiles[y]?.[x] ?? null;
  }

  private spawnSprayCans(accessibleWalls: { x: number; y: number }[]) {
    const randomizedAccessibleWalls = [...accessibleWalls].sort(() => Math.random() - 0.5); // Shuffle positions

    const baseSprayCans = Math.floor(Math.random() * 2) + 3; // 3-4 base spray cans
    const difficultyBonus = Math.min(this.difficultyLevel - 1, 5); // Cap at +5 for balance
    const numSprayCans = this.devOptions.manySprayCans
      ? randomizedAccessibleWalls.length
      : Math.min(baseSprayCans + difficultyBonus, randomizedAccessibleWalls.length);

    this.sprayCans = Array.from({ length: Math.min(numSprayCans, randomizedAccessibleWalls.length) }, (_, i) => {
      const pos = randomizedAccessibleWalls[i];
      const sprayCan = new SprayCan(this.gl, i);
      sprayCan.position.x = pos.x;
      sprayCan.position.y = pos.y;
      sprayCan.position.z = 0.1; // Slightly above ground
      return sprayCan;
    });

    store.dispatch(gameActions.setSprayCans(this.sprayCans.map(sprayCan => sprayCan.id)));

    console.log(`Spawned ${this.sprayCans.length} spray cans at building-road intersections (Level ${this.difficultyLevel})`);
  }

  private DFS(x: number, y: number, visited: Set<Tile>, edges: { x: number; y: number }[]) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return;
    }

    const tile = this.tiles[y]?.[x];
    if (!tile || !walkableTiles.includes(tile.variant) || visited.has(tile)) {
      return;
    }

    visited.add(tile);

    // Check if this tile is a building-road edge
    if (tile.variant === 'stone') {
      const neighbors = this.getNeighborTiles(x, y);
      const buildingNeighbors = neighbors.filter(tile => tile.variant === 'building');
      for (const neighbor of buildingNeighbors) {
        // average position
        const avgX = (neighbor.position.x + x) / 2;
        const avgY = (neighbor.position.y + y) / 2;
        edges.push({ x: avgX, y: avgY });
      }
    }

    this.DFS(x + 1, y, visited, edges);
    this.DFS(x - 1, y, visited, edges);
    this.DFS(x, y + 1, visited, edges);
    this.DFS(x, y - 1, visited, edges);
  }

  private getNeighborTiles(x: number, y: number): Tile[] {
    const neighbors: Tile[] = [];
    const directions = [
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 }
    ];

    for (const { dx, dy } of directions) {
      const nx = x + dx;
      const ny = y + dy;
      const tile = this.getTile(nx, ny);
      if (tile) {
        neighbors.push(tile);
      }
    }

    return neighbors;
  }

  public getSprayCans(): SprayCan[] {
    return this.sprayCans;
  }

  private spawnCops(player: Player, accessibleTiles: Set<Tile>) {
    this.cops = [];

    const minDistanceFromPlayer = 8;
    const validSpawnPoints: { x: number; y: number }[] = Array.from(accessibleTiles)
      .filter(tile => {
        const dx = tile.position.x - player.position.x;
        const dy = tile.position.y - player.position.y;
        const squareDistance = dx * dx + dy * dy;
        return squareDistance > minDistanceFromPlayer * minDistanceFromPlayer
      })
      .map(tile => ({
        x: tile.position.x,
        y: tile.position.y
      }));

    validSpawnPoints.sort(() => Math.random() - 0.5); // Shuffle positions

    // Scale number of cops based on difficulty
    // Level 1: 2-4 cops, Level 2: 3-5, Level 3: 4-6, etc.
    const baseCops = Math.floor(Math.random() * 2) + 1; // 1-2 base cops
    const difficultyBonus = Math.min(this.difficultyLevel - 1, 4); // Cap at +4 for balance
    const numCops = baseCops + difficultyBonus;

    for (let i = 0; i < Math.min(numCops, validSpawnPoints.length); i++) {
      const point = validSpawnPoints[i];
      const cop = new Cop(this.gl, this, player, i, point.x, point.y, this.difficultyLevel);
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
