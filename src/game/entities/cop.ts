import type { Camera } from '../graphics/camera';
import { squareMesh, type Mesh } from '../graphics/mesh';
import { RenderObject } from '../graphics/render-object';
import renderObject from '../graphics/renderer';
import { TextureManager } from '../graphics/texture-manager';
import type { ProgramInfo } from '../graphics/types';
import { Vector3 } from '../math';
import type { Player } from '../player/player';
import type { Level } from '../world/level';

interface PathNode {
  x: number;
  y: number;
  g: number; // Cost from start to current node
  h: number; // Heuristic cost from current to goal
  f: number; // Total cost (g + h)
  parent: PathNode | null;
}

export class Cop extends RenderObject {
  private mesh: Mesh;
  private textureManager: TextureManager;
  private level: Level;
  private player: Player;
  private speed: number = 0.05;
  private chaseRadius: number = 12;
  private id: number;
  private path: { x: number; y: number }[] = [];
  private pathUpdateTimer: number = 0;
  private pathUpdateInterval: number = 60; // Update path every 60 frames (1 second at 60fps)
  private otherCops: Cop[] = [];
  private isFleeing: boolean = false;
  private fleeTimer: number = 0;
  private fleeDuration: number = 60; // 1 second at 60fps
  private fleeTarget: { x: number; y: number } | null = null;

  constructor(gl: WebGLRenderingContext, level: Level, player: Player, id: number, x: number, y: number) {
    super(
      new Vector3(x, y, 0),
      new Vector3(0, 0, 0),
      new Vector3(1, 1, 1),
    );

    this.mesh = squareMesh(gl);
    this.textureManager = TextureManager.getInstance(gl);
    this.level = level;
    this.player = player;
    this.id = id;
  }

  public setOtherCops(cops: Cop[]) {
    this.otherCops = cops;
  }

  public startFleeing() {
    this.isFleeing = true;
    this.fleeTimer = 0;
    this.path = []; // Clear current path
    this.findFleeTarget();
  }

  public render(gl: WebGLRenderingContext, programInfo: ProgramInfo, camera: Camera) {
    renderObject({
      gl,
      info: programInfo,
      object: {
        mesh: this.mesh,
        model: this.model,
        texture: this.textureManager.getEntityTexture('cop'),
        useTexture: this.textureManager.isEntityTextureReady('cop'),
      },
      camera,
    });
  }

  public update() {
    if (this.isFleeing) {
      this.updateFleeing();
      return;
    }

    const distanceToPlayer = this.getDistanceToPlayer();

    if (distanceToPlayer <= this.chaseRadius) {
      this.pathUpdateTimer++;

      // Update path periodically or when we reach the current target
      if (this.pathUpdateTimer >= this.pathUpdateInterval || this.path.length === 0 || this.hasReachedCurrentTarget()) {
        this.updatePath();
        this.pathUpdateTimer = 0;
      }

      this.followPath();
    } else {
      // Clear path when player is out of range
      this.path = [];
    }
  }

  private updateFleeing() {
    this.fleeTimer++;

    if (this.fleeTimer >= this.fleeDuration) {
      this.isFleeing = false;
      this.fleeTarget = null;
      this.path = [];
      return;
    }

    // Update flee target periodically
    if (this.fleeTimer % 30 === 0) { // Every 0.5 seconds
      this.findFleeTarget();
    }

    if (this.fleeTarget) {
      this.moveTowardsFleeTarget();
    }
  }

  private findFleeTarget() {
    const playerX = Math.round(this.player.position.x);
    const playerY = Math.round(this.player.position.y);
    const currentX = Math.round(this.position.x);
    const currentY = Math.round(this.position.y);

    // Calculate direction away from player
    const dx = currentX - playerX;
    const dy = currentY - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) {
      // If cop is on top of player, pick a random direction
      const angle = Math.random() * Math.PI * 2;
      const fleeDistance = 10;
      this.fleeTarget = {
        x: currentX + Math.cos(angle) * fleeDistance,
        y: currentY + Math.sin(angle) * fleeDistance
      };
    } else {
      // Move away from player
      const fleeDistance = 15;
      this.fleeTarget = {
        x: currentX + (dx / distance) * fleeDistance,
        y: currentY + (dy / distance) * fleeDistance
      };
    }

    // Ensure flee target is within level bounds and walkable
    this.fleeTarget.x = Math.max(0, Math.min(this.level.getWidth() - 1, this.fleeTarget.x));
    this.fleeTarget.y = Math.max(0, Math.min(this.level.getHeight() - 1, this.fleeTarget.y));

    // Find nearest walkable tile if target is not walkable
    if (!this.level.isWalkable(Math.round(this.fleeTarget.x), Math.round(this.fleeTarget.y))) {
      const nearestWalkable = this.findNearestWalkable(this.fleeTarget.x, this.fleeTarget.y);
      if (nearestWalkable) {
        this.fleeTarget = nearestWalkable;
      }
    }
  }

  private findNearestWalkable(targetX: number, targetY: number): { x: number; y: number } | null {
    const maxSearchRadius = 10;

    for (let radius = 1; radius <= maxSearchRadius; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
            const x = Math.round(targetX + dx);
            const y = Math.round(targetY + dy);

            if (x >= 0 && x < this.level.getWidth() && y >= 0 && y < this.level.getHeight()) {
              if (this.level.isWalkable(x, y)) {
                return { x, y };
              }
            }
          }
        }
      }
    }

    return null;
  }

  private moveTowardsFleeTarget() {
    if (!this.fleeTarget) return;

    const dx = this.fleeTarget.x - this.position.x;
    const dy = this.fleeTarget.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.5) {
      // Reached flee target, find new one
      this.findFleeTarget();
      return;
    }

    // Move towards flee target
    const vx = (dx / distance) * this.speed * 1.5; // Flee faster
    const vy = (dy / distance) * this.speed * 1.5;

    // Apply collision avoidance with other cops
    const avoidance = this.calculateAvoidance();
    const finalVx = vx + avoidance.x;
    const finalVy = vy + avoidance.y;

    // Calculate new position
    const newPosition = new Vector3(
      this.position.x + finalVx,
      this.position.y + finalVy,
      this.position.z
    );

    // Check if new position is walkable
    const newX = Math.round(newPosition.x);
    const newY = Math.round(newPosition.y);

    if (this.level.isWalkable(newX, newY)) {
      this.position.x = newPosition.x;
      this.position.y = newPosition.y;
      this.position.z = newPosition.z;
      this.rotation.z = -Math.atan2(finalVx, finalVy);
    } else {
      // Try moving only on X axis
      const xOnlyPosition = new Vector3(
        this.position.x + finalVx,
        this.position.y,
        this.position.z
      );
      const xOnlyX = Math.round(xOnlyPosition.x);
      const xOnlyY = Math.round(xOnlyPosition.y);

      if (this.level.isWalkable(xOnlyX, xOnlyY)) {
        this.position.x = xOnlyPosition.x;
        this.position.y = xOnlyPosition.y;
        this.position.z = xOnlyPosition.z;
        this.rotation.z = -Math.atan2(finalVx, 0);
      } else {
        // Try moving only on Y axis
        const yOnlyPosition = new Vector3(
          this.position.x,
          this.position.y + finalVy,
          this.position.z
        );
        const yOnlyX = Math.round(yOnlyPosition.x);
        const yOnlyY = Math.round(yOnlyPosition.y);

        if (this.level.isWalkable(yOnlyX, yOnlyY)) {
          this.position.x = yOnlyPosition.x;
          this.position.y = yOnlyPosition.y;
          this.position.z = yOnlyPosition.z;
          this.rotation.z = -Math.atan2(0, finalVy);
        }
      }
    }
  }

  private getDistanceToPlayer(): number {
    const dx = this.player.position.x - this.position.x;
    const dy = this.player.position.y - this.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private hasReachedCurrentTarget(): boolean {
    if (this.path.length === 0) return true;

    const currentTarget = this.path[0];
    const distance = Math.sqrt(
      Math.pow(this.position.x - currentTarget.x, 2) +
      Math.pow(this.position.y - currentTarget.y, 2)
    );

    return distance < 0.5; // Close enough to consider reached
  }

  private updatePath() {
    const startX = Math.round(this.position.x);
    const startY = Math.round(this.position.y);
    const goalX = Math.round(this.player.position.x);
    const goalY = Math.round(this.player.position.y);

    this.path = this.findPath(startX, startY, goalX, goalY);
  }

  private findPath(startX: number, startY: number, goalX: number, goalY: number): { x: number; y: number }[] {
    const openSet: PathNode[] = [];
    const closedSet: Set<string> = new Set();

    const startNode: PathNode = {
      x: startX,
      y: startY,
      g: 0,
      h: this.heuristic(startX, startY, goalX, goalY),
      f: 0,
      parent: null
    };
    startNode.f = startNode.g + startNode.h;

    openSet.push(startNode);

    while (openSet.length > 0) {
      // Find node with lowest f cost
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[currentIndex].f) {
          currentIndex = i;
        }
      }

      const currentNode = openSet[currentIndex];

      // Check if we reached the goal
      if (currentNode.x === goalX && currentNode.y === goalY) {
        return this.reconstructPath(currentNode);
      }

      // Move current node from open to closed set
      openSet.splice(currentIndex, 1);
      closedSet.add(`${currentNode.x},${currentNode.y}`);

      // Check neighbors
      const neighbors = this.getNeighbors(currentNode.x, currentNode.y);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;

        if (closedSet.has(neighborKey)) continue;

        const tentativeG = currentNode.g + 1;

        let neighborNode = openSet.find(node => node.x === neighbor.x && node.y === neighbor.y);

        if (!neighborNode) {
          neighborNode = {
            x: neighbor.x,
            y: neighbor.y,
            g: tentativeG,
            h: this.heuristic(neighbor.x, neighbor.y, goalX, goalY),
            f: 0,
            parent: currentNode
          };
          neighborNode.f = neighborNode.g + neighborNode.h;
          openSet.push(neighborNode);
        } else if (tentativeG < neighborNode.g) {
          neighborNode.g = tentativeG;
          neighborNode.f = tentativeG + neighborNode.h;
          neighborNode.parent = currentNode;
        }
      }
    }

    // No path found, return empty array
    return [];
  }

  private getNeighbors(x: number, y: number): { x: number; y: number }[] {
    const neighbors: { x: number; y: number }[] = [];
    const directions = [
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 }
    ];

    for (const { dx, dy } of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (this.level.isWalkable(nx, ny)) {
        neighbors.push({ x: nx, y: ny });
      }
    }

    return neighbors;
  }

  private heuristic(x1: number, y1: number, x2: number, y2: number): number {
    // Manhattan distance
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  private reconstructPath(endNode: PathNode): { x: number; y: number }[] {
    const path: { x: number; y: number }[] = [];
    let current: PathNode | null = endNode;

    while (current) {
      path.unshift({ x: current.x, y: current.y });
      current = current.parent;
    }

    return path.slice(1); // Remove start node
  }

  private followPath() {
    if (this.path.length === 0) return;

    const target = this.path[0];
    const dx = target.x - this.position.x;
    const dy = target.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.5) {
      // Reached current target, move to next
      this.path.shift();
      return;
    }

    // Calculate movement direction
    const vx = (dx / distance) * this.speed;
    const vy = (dy / distance) * this.speed;

    // Apply collision avoidance with other cops
    const avoidance = this.calculateAvoidance();
    const finalVx = vx + avoidance.x;
    const finalVy = vy + avoidance.y;

    // Calculate new position
    const newPosition = new Vector3(
      this.position.x + finalVx,
      this.position.y + finalVy,
      this.position.z
    );

    // Check if new position is walkable
    const newX = Math.round(newPosition.x);
    const newY = Math.round(newPosition.y);

    if (this.level.isWalkable(newX, newY)) {
      this.position.x = newPosition.x;
      this.position.y = newPosition.y;
      this.position.z = newPosition.z;
      this.rotation.z = -Math.atan2(finalVx, finalVy);
    } else {
      // Try moving only on X axis
      const xOnlyPosition = new Vector3(
        this.position.x + finalVx,
        this.position.y,
        this.position.z
      );
      const xOnlyX = Math.round(xOnlyPosition.x);
      const xOnlyY = Math.round(xOnlyPosition.y);

      if (this.level.isWalkable(xOnlyX, xOnlyY)) {
        this.position.x = xOnlyPosition.x;
        this.position.y = xOnlyPosition.y;
        this.position.z = xOnlyPosition.z;
        this.rotation.z = -Math.atan2(finalVx, 0);
      } else {
        // Try moving only on Y axis
        const yOnlyPosition = new Vector3(
          this.position.x,
          this.position.y + finalVy,
          this.position.z
        );
        const yOnlyX = Math.round(yOnlyPosition.x);
        const yOnlyY = Math.round(yOnlyPosition.y);

        if (this.level.isWalkable(yOnlyX, yOnlyY)) {
          this.position.x = yOnlyPosition.x;
          this.position.y = yOnlyPosition.y;
          this.position.z = yOnlyPosition.z;
          this.rotation.z = -Math.atan2(0, finalVy);
        }
      }
    }
  }

  private calculateAvoidance(): { x: number; y: number } {
    let avoidanceX = 0;
    let avoidanceY = 0;
    const avoidanceRadius = 2.0;
    const avoidanceStrength = 0.02;

    for (const otherCop of this.otherCops) {
      const dx = this.position.x - otherCop.position.x;
      const dy = this.position.y - otherCop.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < avoidanceRadius && distance > 0) {
        const force = (avoidanceRadius - distance) / avoidanceRadius;
        avoidanceX += (dx / distance) * force * avoidanceStrength;
        avoidanceY += (dy / distance) * force * avoidanceStrength;
      }
    }

    return { x: avoidanceX, y: avoidanceY };
  }

  public getId(): number {
    return this.id;
  }

  public isNearPlayer(radius: number = 1.5): boolean {
    return this.getDistanceToPlayer() <= radius;
  }
}
