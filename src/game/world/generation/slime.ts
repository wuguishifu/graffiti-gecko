import { Vector3 } from '@/game/math';
import { Tile } from '@/game/tiles/tile';

export type RoadBendOrder = 'horizontal-vertical' | 'vertical-horizontal' | 'random';

// Helper: Poisson disk sampling for grid
function poissonDiskSampleGrid(width: number, height: number, minDist: number, maxTries = 30): { x: number, y: number }[] {
  // Use Bridson's algorithm, adapted for integer grid
  const cellSize = minDist / Math.SQRT2;
  const gridW = Math.ceil(width / cellSize);
  const gridH = Math.ceil(height / cellSize);
  const grid: (null | { x: number, y: number })[][] = Array.from({ length: gridH }, () => Array(gridW).fill(null));
  const samples: { x: number, y: number }[] = [];
  const active: { x: number, y: number }[] = [];

  // Start from a random point (not center)
  let first;
  do {
    first = {
      x: Math.floor(Math.random() * width),
      y: Math.floor(Math.random() * height)
    };
  } while (first.x === Math.floor(width / 2) && first.y === Math.floor(height / 2));
  samples.push(first);
  active.push(first);
  grid[Math.floor(first.y / cellSize)][Math.floor(first.x / cellSize)] = first;

  while (active.length > 0) {
    const idx = Math.floor(Math.random() * active.length);
    const point = active[idx];
    let found = false;
    for (let t = 0; t < maxTries; t++) {
      const angle = Math.random() * 2 * Math.PI;
      const radius = minDist * (1 + Math.random());
      const nx = Math.round(point.x + Math.cos(angle) * radius);
      const ny = Math.round(point.y + Math.sin(angle) * radius);
      if (
        nx >= 0 && nx < width && ny >= 0 && ny < height &&
        !(nx === Math.floor(width / 2) && ny === Math.floor(height / 2))
      ) {
        // Check minDist to all neighbors in grid
        let ok = true;
        const gi = Math.floor(nx / cellSize);
        const gj = Math.floor(ny / cellSize);
        for (let i = Math.max(0, gj - 2); i <= Math.min(gridH - 1, gj + 2); i++) {
          for (let j = Math.max(0, gi - 2); j <= Math.min(gridW - 1, gi + 2); j++) {
            const neighbor = grid[i][j];
            if (neighbor) {
              const dx = neighbor.x - nx;
              const dy = neighbor.y - ny;
              if (dx * dx + dy * dy < minDist * minDist) {
                ok = false;
                break;
              }
            }
          }
          if (!ok) break;
        }
        if (ok) {
          const newPoint = { x: nx, y: ny };
          samples.push(newPoint);
          active.push(newPoint);
          grid[gj][gi] = newPoint;
          found = true;
          break;
        }
      }
    }
    if (!found) {
      active.splice(idx, 1);
    }
  }
  return samples;
}

export function slime(
  tiles: Tile[][],
  gl: WebGLRenderingContext,
  roadBendOrder: RoadBendOrder = 'horizontal-vertical'
) {
  const center = {
    x: Math.floor(tiles.length / 2),
    y: Math.floor(tiles[0].length / 2)
  };

  tiles[center.y][center.x] = new Tile({
    position: new Vector3(center.x, center.y, 0),
    variant: 'stone',
    gl,
  });

  // Poisson disk sample for stone tiles (excluding center)
  const minDist = 5; // tweak for density
  const poissonPoints = poissonDiskSampleGrid(tiles[0].length, tiles.length, minDist);
  for (const { x, y } of poissonPoints) {
    tiles[y][x] = new Tile({
      position: new Vector3(x, y, 0),
      variant: 'stone',
      gl,
    });
  }

  // Collect all stone tile positions (excluding center)
  const stonePositions: { x: number; y: number }[] = [];
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[0].length; x++) {
      if (
        tiles[y][x]?.variant === 'stone' &&
        !(x === center.x && y === center.y)
      ) {
        stonePositions.push({ x, y });
      }
    }
  }

  // Helper to lay a road between two points with at most two bends
  function layRoad(
    from: { x: number; y: number },
    to: { x: number; y: number },
    order: 'horizontal-vertical' | 'vertical-horizontal'
  ) {
    let x = from.x;
    let y = from.y;
    if (order === 'horizontal-vertical') {
      // Move horizontally first
      while (x !== to.x) {
        x += x < to.x ? 1 : -1;
        if (tiles[y][x].variant !== 'stone') {
          tiles[y][x] = new Tile({
            position: new Vector3(x, y, 0),
            variant: 'stone',
            gl,
          });
        }
      }
      // Then vertically
      while (y !== to.y) {
        y += y < to.y ? 1 : -1;
        if (tiles[y][x].variant !== 'stone') {
          tiles[y][x] = new Tile({
            position: new Vector3(x, y, 0),
            variant: 'stone',
            gl,
          });
        }
      }
    } else {
      // Move vertically first
      while (y !== to.y) {
        y += y < to.y ? 1 : -1;
        if (tiles[y][x].variant !== 'stone') {
          tiles[y][x] = new Tile({
            position: new Vector3(x, y, 0),
            variant: 'stone',
            gl,
          });
        }
      }
      // Then horizontally
      while (x !== to.x) {
        x += x < to.x ? 1 : -1;
        if (tiles[y][x].variant !== 'stone') {
          tiles[y][x] = new Tile({
            position: new Vector3(x, y, 0),
            variant: 'stone',
            gl,
          });
        }
      }
    }
  }

  // Connect each stone tile to the center
  for (const pos of stonePositions) {
    let order: 'horizontal-vertical' | 'vertical-horizontal';
    if (roadBendOrder === 'random') {
      order = Math.random() < 0.5 ? 'horizontal-vertical' : 'vertical-horizontal';
    } else {
      order = roadBendOrder;
    }
    layRoad(center, pos, order);
  }
}
