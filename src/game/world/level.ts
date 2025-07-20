import type { Camera } from '../graphics/camera';
import renderObject from '../graphics/renderer';
import type { ProgramInfo } from '../graphics/types';
import { Vector3 } from '../math';
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

export class Level {
  private gl: WebGLRenderingContext;
  private tiles: Tile[][] = [];
  private width = 20;
  private height = 20;
  private grid: Cell[][] = [];

  // Define adjacency rules for city blocks
  private rules: Record<TileType, TileType[]> = {
    grass: ['stone', 'grass'], // Grass can be next to grass or stone (parks)
    stone: ['grass', 'building', 'stone'], // Stone can be next to anything (roads)
    building: ['stone', 'building'] // Building can be next to stone or building (city blocks)
  };

  // Add weights to favor larger city blocks
  private tileWeights: Record<TileType, number> = {
    grass: 0.2,    // Less common - parks
    stone: 0.3,    // Roads
    building: 0.5  // Most common - buildings
  };

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.generate();
  }

  public generate() {
    const maxRetries = 10;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        console.log(`Attempt ${retries + 1} to generate level...`);
        this.initializeGrid();
        this.collapseWaveFunction();
        this.createTiles();
        console.log('Level generated successfully!');
        return;
      } catch (error) {
        console.log(`Attempt ${retries + 1} failed:`, error);
        retries++;
        if (retries >= maxRetries) {
          console.warn('Failed to generate level after', maxRetries, 'attempts, using fallback');
          this.generateFallbackLevel();
          return;
        }
      }
    }
  }

  private initializeGrid() {
    this.grid = [];
    for (let y = 0; y < this.height; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x] = {
          x,
          y,
          possibleTiles: new Set(['grass', 'stone', 'building']),
          collapsed: false
        };
      }
    }

    // Create initial city structure with stone roads
    this.createInitialRoads();
  }

  private createInitialRoads() {
    // Create horizontal roads every 4-5 cells
    for (let y = 4; y < this.height; y += 5) {
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x].possibleTiles = new Set(['stone']);
        this.grid[y][x].collapsed = true;
        this.grid[y][x].finalTile = 'stone';
      }
    }

    // Create vertical roads every 4-5 cells
    for (let x = 4; x < this.width; x += 5) {
      for (let y = 0; y < this.height; y++) {
        if (!this.grid[y][x].collapsed) {
          this.grid[y][x].possibleTiles = new Set(['stone']);
          this.grid[y][x].collapsed = true;
          this.grid[y][x].finalTile = 'stone';
        }
      }
    }
  }

  private collapseWaveFunction() {
    while (this.hasUncollapsedCells()) {
      const cell = this.getLowestEntropyCell();
      if (!cell) break;

      this.collapseCell(cell);
      this.propagateConstraints(cell);
    }
  }

  private hasUncollapsedCells(): boolean {
    return this.grid.some(row => row.some(cell => !cell.collapsed));
  }

  private getLowestEntropyCell(): Cell | null {
    let minEntropy = Infinity;
    let candidates: Cell[] = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.grid[y][x];
        if (!cell.collapsed) {
          const entropy = cell.possibleTiles.size;
          if (entropy === 0) {
            console.log(`Found cell (${x}, ${y}) with 0 entropy - this shouldn't happen!`);
            throw new Error(`Cell (${x}, ${y}) has no possible tiles`);
          }
          if (entropy < minEntropy) {
            minEntropy = entropy;
            candidates = [cell];
          } else if (entropy === minEntropy) {
            candidates.push(cell);
          }
        }
      }
    }

    if (candidates.length === 0) return null;

    // Prefer cells that are adjacent to already collapsed cells (for better city block formation)
    const adjacentCandidates = candidates.filter(cell => this.hasCollapsedNeighbors(cell));

    if (adjacentCandidates.length > 0) {
      const selectedCell = adjacentCandidates[Math.floor(Math.random() * adjacentCandidates.length)];
      console.log(`Selected adjacent cell (${selectedCell.x}, ${selectedCell.y}) with entropy ${selectedCell.possibleTiles.size}`);
      return selectedCell;
    }

    // Fallback to any cell with lowest entropy
    const selectedCell = candidates[Math.floor(Math.random() * candidates.length)];
    console.log(`Selected cell (${selectedCell.x}, ${selectedCell.y}) with entropy ${selectedCell.possibleTiles.size}`);
    return selectedCell;
  }

  private hasCollapsedNeighbors(cell: Cell): boolean {
    const neighbors = this.getNeighbors(cell);
    return neighbors.some(neighbor => neighbor.collapsed);
  }

  private collapseCell(cell: Cell) {
    const possibleTiles = Array.from(cell.possibleTiles);
    if (possibleTiles.length === 0) {
      throw new Error(`Cannot collapse cell (${cell.x}, ${cell.y}) - no possible tiles`);
    }

    // Use weighted selection to favor certain tiles
    const selectedTile = this.selectWeightedTile(possibleTiles);
    console.log(`Collapsing cell (${cell.x}, ${cell.y}) to ${selectedTile} from options: ${possibleTiles}`);

    cell.collapsed = true;
    cell.finalTile = selectedTile;
    cell.possibleTiles.clear();
    cell.possibleTiles.add(selectedTile);
  }

  private selectWeightedTile(possibleTiles: TileType[]): TileType {
    // Calculate total weight for possible tiles
    const totalWeight = possibleTiles.reduce((sum, tile) => sum + this.tileWeights[tile], 0);

    // Generate random value
    const random = Math.random() * totalWeight;

    // Select tile based on weight
    let currentWeight = 0;
    for (const tile of possibleTiles) {
      currentWeight += this.tileWeights[tile];
      if (random <= currentWeight) {
        return tile;
      }
    }

    // Fallback to last tile
    return possibleTiles[possibleTiles.length - 1];
  }

  private propagateConstraints(collapsedCell: Cell) {
    const queue: Cell[] = [collapsedCell];

    while (queue.length > 0) {
      const cell = queue.shift()!;

      if (cell !== collapsedCell) {
        console.log(`Skipping cell (${cell.x}, ${cell.y}) in queue - not the original collapsed cell`);
        continue;
      }

      if (!cell.finalTile) {
        throw new Error(`Cell (${cell.x}, ${cell.y}) is collapsed but has no finalTile`);
      }

      const neighbors = this.getNeighbors(cell);

      for (const neighbor of neighbors) {
        if (neighbor.collapsed) continue;

        const originalSize = neighbor.possibleTiles.size;
        this.updateNeighborConstraints(neighbor, cell.finalTile);

        if (neighbor.possibleTiles.size < originalSize) {
          if (neighbor.possibleTiles.size === 0) {
            throw new Error(`Contradiction detected at (${neighbor.x}, ${neighbor.y})`);
          }
        }
      }
    }
  }

  private getNeighbors(cell: Cell): Cell[] {
    const neighbors: Cell[] = [];
    const directions = [
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 }
    ];

    for (const { dx, dy } of directions) {
      const nx = cell.x + dx;
      const ny = cell.y + dy;

      if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
        neighbors.push(this.grid[ny][nx]);
      }
    }

    return neighbors;
  }

  private updateNeighborConstraints(neighbor: Cell, centerTile: TileType) {
    const allowedTiles = this.rules[centerTile];
    const newPossibleTiles = new Set<TileType>();

    for (const tile of neighbor.possibleTiles) {
      if (allowedTiles?.includes(tile)) {
        newPossibleTiles.add(tile);
      }
    }

    neighbor.possibleTiles = newPossibleTiles;
  }

  private createTiles() {
    this.tiles = [];
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        const cell = this.grid[y][x];
        if (cell.finalTile) {
          this.tiles[y][x] = new Tile({
            position: new Vector3(x, y, 0),
            rotation: new Vector3(0, 0, 0),
            scale: new Vector3(1, 1, 1),
            variant: cell.finalTile,
            gl: this.gl
          });
        }
      }
    }
  }

  public getTiles(): Tile[][] {
    return this.tiles;
  }

  private generateFallbackLevel() {
    this.tiles = [];
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        let variant: TileType = 'stone';

        if (x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1) {
          variant = 'grass';
        }

        this.tiles[y][x] = new Tile({
          position: new Vector3(x, y, 0),
          rotation: new Vector3(0, 0, 0),
          scale: new Vector3(1, 1, 1),
          variant,
          gl: this.gl
        });
      }
    }
  }

  public render(gl: WebGLRenderingContext, programInfo: ProgramInfo, camera: Camera) {
    this.tiles.forEach(row => {
      row.forEach(tile => {
        renderObject({
          gl,
          info: programInfo,
          object: {
            mesh: tile.mesh(gl),
            model: tile.model,
            texture: tile.texture,
            useTexture: tile.isTextureReady,
          },
          camera,
        });
      });
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
}
