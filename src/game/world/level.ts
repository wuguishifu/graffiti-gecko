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

export class Level {
  private gl: WebGLRenderingContext;
  private tiles: Tile[][] = [];
  private width = 20;
  private height = 20;
  private grid: Cell[][] = [];

  // Define adjacency rules
  private rules: Record<TileType, TileType[]> = {
    grass: ['stone'],
    stone: ['grass', 'building'],
    building: ['stone']
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
        this.initializeGrid();
        this.collapseWaveFunction();
        this.createTiles();
        return; // Success, exit the retry loop
      } catch {
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

    // Randomly select from cells with lowest entropy
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  private collapseCell(cell: Cell) {
    const possibleTiles = Array.from(cell.possibleTiles);
    const selectedTile = possibleTiles[Math.floor(Math.random() * possibleTiles.length)];

    cell.collapsed = true;
    cell.finalTile = selectedTile;
    cell.possibleTiles.clear();
    cell.possibleTiles.add(selectedTile);
  }

  private propagateConstraints(collapsedCell: Cell) {
    const queue: Cell[] = [collapsedCell];

    while (queue.length > 0) {
      const cell = queue.shift()!;
      const neighbors = this.getNeighbors(cell);

      for (const neighbor of neighbors) {
        if (neighbor.collapsed) continue;

        const originalSize = neighbor.possibleTiles.size;
        this.updateNeighborConstraints(neighbor, cell.finalTile!);

        if (neighbor.possibleTiles.size < originalSize) {
          if (neighbor.possibleTiles.size === 0) {
            // Contradiction - throw error to trigger retry
            throw new Error('Contradiction detected in wave function collapse');
          }
          queue.push(neighbor);
        }
      }
    }
  }

  private getNeighbors(cell: Cell): Cell[] {
    const neighbors: Cell[] = [];
    const directions = [
      { dx: -1, dy: 0 }, // left
      { dx: 1, dy: 0 },  // right
      { dx: 0, dy: -1 }, // up
      { dx: 0, dy: 1 }   // down
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
    // Create a simple fallback level with stone borders and grass in the middle
    this.tiles = [];
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        let variant: TileType = 'stone';

        // Create stone borders
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
}
