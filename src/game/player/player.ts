import { gameActions } from '../../state/gameSlice';
import { store } from '../../state/store';
import type { Camera } from '../graphics/camera';
import { squareMesh, type Mesh } from '../graphics/mesh';
import { RenderObject } from '../graphics/render-object';
import renderObject from '../graphics/renderer';
import { TextureManager } from '../graphics/texture-manager';
import type { ProgramInfo } from '../graphics/types';
import { Vector3 } from '../math';
import type { Level } from '../world/level';

const PLAYER_LIVES = 3;

export class Player extends RenderObject {
  private mesh: Mesh;
  private textureManager: TextureManager;
  private level: Level;
  private lives: number = PLAYER_LIVES;
  private invincibilityTimer: number = 0;
  private invincibilityDuration: number = 60; // 1 second at 60fps
  private isInvincible: boolean = false;
  private flashTimer: number = 0;
  private flashInterval: number = 10; // Flash every 10 frames

  constructor(gl: WebGLRenderingContext, level: Level) {
    super(
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0),
      new Vector3(1, 1, 1),
    );

    this.mesh = squareMesh(gl);
    this.textureManager = TextureManager.getInstance(gl);
    this.level = level;

    store.dispatch(gameActions.setLives(PLAYER_LIVES));
  }

  public render(gl: WebGLRenderingContext, programInfo: ProgramInfo, camera: Camera) {
    // Flash effect during invincibility
    if (this.isInvincible) {
      this.flashTimer++;
      if (this.flashTimer % this.flashInterval < this.flashInterval / 2) {
        return; // Skip rendering every other flash interval
      }
    }

    renderObject({
      gl,
      info: programInfo,
      object: {
        mesh: this.mesh,
        model: this.model,
        texture: this.textureManager.getEntityTexture('gecko'),
        useTexture: this.textureManager.isEntityTextureReady('gecko'),
      },
      camera,
    });
  }

  public update() {
    // Update invincibility timer
    if (this.isInvincible) {
      this.invincibilityTimer++;
      if (this.invincibilityTimer >= this.invincibilityDuration) {
        this.isInvincible = false;
        this.invincibilityTimer = 0;
      }
    }

    let vx = 0;
    let vy = 0;
    let ax = 0.1;

    if (this.keysDown.has('shift')) ax = 0.2;

    if (this.keysDown.has('w')) vy += ax;
    if (this.keysDown.has('s')) vy -= ax;
    if (this.keysDown.has('a')) vx -= ax;
    if (this.keysDown.has('d')) vx += ax;

    if (vx === 0 && vy === 0) return;

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

  public takeDamage(): boolean {
    if (this.isInvincible) {
      return false; // No damage taken during invincibility
    }

    this.lives--;
    this.isInvincible = true;
    this.invincibilityTimer = 0;
    this.flashTimer = 0;

    console.log(`Player took damage! Lives remaining: ${this.lives}`);
    return true; // Damage was taken
  }

  public getLives(): number {
    return this.lives;
  }

  public isInvulnerable(): boolean {
    return this.isInvincible;
  }

  private keysDown: Set<string> = new Set();

  public onKeyDown(event: KeyboardEvent) {
    if (this.keysDown.has(event.key.toLowerCase())) return;
    this.keysDown.add(event.key.toLowerCase());
  }

  public onKeyUp(event: KeyboardEvent) {
    this.keysDown.delete(event.key.toLowerCase());
  }
}
