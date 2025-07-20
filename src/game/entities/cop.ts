import type { Camera } from '../graphics/camera';
import { squareMesh, type Mesh } from '../graphics/mesh';
import { RenderObject } from '../graphics/render-object';
import renderObject from '../graphics/renderer';
import { TextureManager } from '../graphics/texture-manager';
import type { ProgramInfo } from '../graphics/types';
import { Vector3 } from '../math';
import type { Level } from '../world/level';
import type { Player } from '../player/player';

export class Cop extends RenderObject {
  private mesh: Mesh;
  private textureManager: TextureManager;
  private level: Level;
  private player: Player;
  private speed: number = 0.05;
  private detectionRadius: number = 8;
  private chaseRadius: number = 12;
  private id: number;

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
    const distanceToPlayer = this.getDistanceToPlayer();

    if (distanceToPlayer <= this.chaseRadius) {
      this.chasePlayer();
    }
  }

  private getDistanceToPlayer(): number {
    const dx = this.player.position.x - this.position.x;
    const dy = this.player.position.y - this.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private chasePlayer() {
    const dx = this.player.position.x - this.position.x;
    const dy = this.player.position.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return;

    // Normalize direction and apply speed
    const vx = (dx / distance) * this.speed;
    const vy = (dy / distance) * this.speed;

    // Calculate new position
    const newPosition = new Vector3(
      this.position.x + vx,
      this.position.y + vy,
      this.position.z
    );

    // Check if new position is walkable
    const newX = Math.round(newPosition.x);
    const newY = Math.round(newPosition.y);

    if (this.level.isWalkable(newX, newY)) {
      this.position.x = newPosition.x;
      this.position.y = newPosition.y;
      this.position.z = newPosition.z;
      this.rotation.z = -Math.atan2(vx, vy);
    } else {
      // Try moving only on X axis
      const xOnlyPosition = new Vector3(
        this.position.x + vx,
        this.position.y,
        this.position.z
      );
      const xOnlyX = Math.round(xOnlyPosition.x);
      const xOnlyY = Math.round(xOnlyPosition.y);

      if (this.level.isWalkable(xOnlyX, xOnlyY)) {
        this.position.x = xOnlyPosition.x;
        this.position.y = xOnlyPosition.y;
        this.position.z = xOnlyPosition.z;
        this.rotation.z = -Math.atan2(vx, 0);
      } else {
        // Try moving only on Y axis
        const yOnlyPosition = new Vector3(
          this.position.x,
          this.position.y + vy,
          this.position.z
        );
        const yOnlyX = Math.round(yOnlyPosition.x);
        const yOnlyY = Math.round(yOnlyPosition.y);

        if (this.level.isWalkable(yOnlyX, yOnlyY)) {
          this.position.x = yOnlyPosition.x;
          this.position.y = yOnlyPosition.y;
          this.position.z = yOnlyPosition.z;
          this.rotation.z = -Math.atan2(0, vy);
        }
      }
    }
  }

  public getId(): number {
    return this.id;
  }

  public isNearPlayer(radius: number = 1.5): boolean {
    return this.getDistanceToPlayer() <= radius;
  }
}
