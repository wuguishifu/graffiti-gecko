import { Tile } from '@/game/tiles/tile';

export type RoadBendOrder = 'horizontal-vertical' | 'vertical-horizontal' | 'random';

export class Slime {
  // Helper: Poisson disk sampling for grid
  private static poissonDiskSampleGrid(width: number, height: number, minDist: number, maxTries = 30): { x: number, y: number }[] {
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

  public static generate(tiles: Tile[][], roadBendOrder: RoadBendOrder = 'horizontal-vertical') {
    const center = {
      x: Math.floor(tiles.length / 2),
      y: Math.floor(tiles[0].length / 2)
    };

    tiles[center.y][center.x].variant = 'stone'

    // Poisson disk sample for stone tiles (excluding center)
    const minDist = 5; // tweak for density
    const poissonPoints = this.poissonDiskSampleGrid(tiles[0].length, tiles.length, minDist);
    for (const { x, y } of poissonPoints) {
      tiles[y][x].variant = 'stone';
    }

    // Collect all stone tile positions (including center)
    const stonePositions: { x: number; y: number }[] = [center];
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

    // --- MST (Kruskal's algorithm) ---
    // Build all possible edges with distances
    type Edge = { a: number; b: number; dist: number };
    const edges: Edge[] = [];
    for (let i = 0; i < stonePositions.length; i++) {
      for (let j = i + 1; j < stonePositions.length; j++) {
        const dx = stonePositions[i].x - stonePositions[j].x;
        const dy = stonePositions[i].y - stonePositions[j].y;
        const dist = dx * dx + dy * dy;
        edges.push({ a: i, b: j, dist });
      }
    }
    edges.sort((e1, e2) => e1.dist - e2.dist);

    // Disjoint set for Kruskal's
    const parent = Array(stonePositions.length).fill(0).map((_, i) => i);
    function find(u: number): number {
      if (parent[u] !== u) parent[u] = find(parent[u]);
      return parent[u];
    }
    function union(u: number, v: number) {
      parent[find(u)] = find(v);
    }

    const mstEdges: Edge[] = [];
    for (const edge of edges) {
      if (find(edge.a) !== find(edge.b)) {
        union(edge.a, edge.b);
        mstEdges.push(edge);
      }
    }

    // --- Add extra random edges for loops ---
    const extraEdges: Edge[] = [];
    const numExtra = Math.max(2, Math.floor(stonePositions.length * 0.15));
    let added = 0;
    const used = new Set(mstEdges.map(e => `${e.a},${e.b}`));
    while (added < numExtra) {
      const idx = Math.floor(Math.random() * edges.length);
      const edge = edges[idx];
      const key = `${edge.a},${edge.b}`;
      if (!used.has(key)) {
        extraEdges.push(edge);
        used.add(key);
        added++;
      }
    }

    // --- Lay roads for all edges in MST and extra edges ---
    const allEdges = [...mstEdges, ...extraEdges];
    const edgeSet = new Set(allEdges.map(e => `${e.a},${e.b}`));
    for (const edge of allEdges) {
      const from = stonePositions[edge.a];
      const to = stonePositions[edge.b];
      let order: 'horizontal-vertical' | 'vertical-horizontal';
      if (roadBendOrder === 'random') {
        order = Math.random() < 0.5 ? 'horizontal-vertical' : 'vertical-horizontal';
      } else {
        order = roadBendOrder;
      }
      this.layRoad(from, to, order, tiles);
    }

    // --- Connect each stone tile to its nearest unconnected neighbor ---
    for (let i = 0; i < stonePositions.length; i++) {
      let minDist = Infinity;
      let nearestIdx = -1;
      for (let j = 0; j < stonePositions.length; j++) {
        if (i === j) continue;
        // Always use a consistent key order
        const key = i < j ? `${i},${j}` : `${j},${i}`;
        if (edgeSet.has(key)) continue; // skip already connected
        const dx = stonePositions[i].x - stonePositions[j].x;
        const dy = stonePositions[i].y - stonePositions[j].y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = j;
        }
      }
      if (nearestIdx !== -1) {
        const key = i < nearestIdx ? `${i},${nearestIdx}` : `${nearestIdx},${i}`;
        let order: 'horizontal-vertical' | 'vertical-horizontal';
        if (roadBendOrder === 'random') {
          order = Math.random() < 0.5 ? 'horizontal-vertical' : 'vertical-horizontal';
        } else {
          order = roadBendOrder;
        }
        this.layRoad(stonePositions[i], stonePositions[nearestIdx], order, tiles);
        edgeSet.add(key);
      }
    }

    // --- Generate walls around roads ---
    this.generateWall(tiles);

    // --- Replace small grass islands with building vent tiles ---
    this.fillIslands(tiles);
  }

  private static fillIslands(tiles: Tile[][]) {
    const width = tiles[0].length;
    const height = tiles.length;
    const visited: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));
    const grassIslands: { tiles: Set<Tile> }[] = [];

    function dfsGrassIsland(x: number, y: number, island: Set<Tile>) {
      if (
        x < 0 || x >= width || y < 0 || y >= height ||
        visited[y][x] || tiles[y][x].variant !== 'grass'
      ) {
        return;
      }
      visited[y][x] = true;
      island.add(tiles[y][x]);
      dfsGrassIsland(x + 1, y, island);
      dfsGrassIsland(x - 1, y, island);
      dfsGrassIsland(x, y + 1, island);
      dfsGrassIsland(x, y - 1, island);
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!visited[y][x] && tiles[y][x].variant === 'grass') {
          const island: Set<Tile> = new Set();
          dfsGrassIsland(x, y, island);
          if (island.size > 0) {
            grassIslands.push({ tiles: island });
          }
        }
      }
    }

    for (const island of grassIslands) {
      if (island.tiles.size <= 4) {
        for (const tile of island.tiles) {
          tile.variant = 'vent';
        }
      }
    }
  }

  // Helper to lay a road between two points with at most two bends
  private static layRoad(
    from: { x: number; y: number },
    to: { x: number; y: number },
    order: 'horizontal-vertical' | 'vertical-horizontal',
    tiles: Tile[][],
  ) {
    let x = from.x;
    let y = from.y;
    if (order === 'horizontal-vertical') {
      // Move horizontally first
      while (x !== to.x) {
        x += x < to.x ? 1 : -1;
        if (tiles[y][x].variant !== 'stone') {
          tiles[y][x].variant = 'stone';
        }
      }
      // Then vertically
      while (y !== to.y) {
        y += y < to.y ? 1 : -1;
        if (tiles[y][x].variant !== 'stone') {
          tiles[y][x].variant = 'stone';
        }
      }
    } else {
      // Move vertically first
      while (y !== to.y) {
        y += y < to.y ? 1 : -1;
        if (tiles[y][x].variant !== 'stone') {
          tiles[y][x].variant = 'stone';
        }
      }
      // Then horizontally
      while (x !== to.x) {
        x += x < to.x ? 1 : -1;
        if (tiles[y][x].variant !== 'stone') {
          tiles[y][x].variant = 'stone';
        }
      }
    }
  }

  public static generateWall(tiles: Tile[][]) {
    const width = tiles[0].length;
    const height = tiles.length;

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
      x >= 0 && x < width && y >= 0 && y < height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = tiles[y]?.[x];
        if (tile?.variant === 'stone') {
          for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            if (inBounds(nx, ny)) {
              const neighbor = tiles[ny]?.[nx];
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
      if (!tiles[y]) tiles[y] = [];
      tiles[y][x].variant = 'building';
    }
  }
}
