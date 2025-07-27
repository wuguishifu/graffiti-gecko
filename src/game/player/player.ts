import { gameActions } from '../../state/game-slice';
import { store } from '../../state/store';
import type { Camera } from '../graphics/camera';
import { type Mesh, squareMesh } from '../graphics/mesh';
import { RenderObject } from '../graphics/render-object';
import { renderObject } from '../graphics/renderer';
import { TextureManager } from '../graphics/texture-manager';
import type { ProgramInfo } from '../graphics/types';
import { Vector3 } from '../math';
import { soundService } from '../sound/sound';
import { PausableInterval } from '../util/pauseable-interval';
import { PausableTimeout } from '../util/pauseable-timeout';
import type { Level } from '../world/level';

import { DevSliceState } from '@/state/dev-slice';

const PLAYER_LIVES = 3;

export class Player extends RenderObject {
  private walkSpeed = 0.04;
  private mesh: Mesh;
  private textureManager: TextureManager;
  private level: Level;
  private gl: WebGLRenderingContext;
  private lives: number = PLAYER_LIVES;
  private invincibilityTimer = 0;
  private invincibilityDuration = 60; // 1 second at 60fps
  private isInvincible = false;
  private flashTimer = 0;
  private flashInterval = 10; // Flash every 10 frames
  private totalDistanceTraveled = 0;
  private lastPosition: Vector3;
  private isDodging = false;
  public isOnDodgeCooldown = false;
  private dodgeTimeout: PausableTimeout | null = null;
  private dodgeTimerInterval: PausableInterval | null = null;
  public static dodgeDurationMs = 3000;
  public static dodgeCooldownMs = 7000;

  constructor(
    gl: WebGLRenderingContext,
    level: Level,
    private devOptions: Partial<DevSliceState>,
  ) {
    super(level.getRandomStoneTile() ?? new Vector3(0, 0, 0), new Vector3(0, 0, 0), new Vector3(1, 1, 1));
    this.devOptions = devOptions;
    this.gl = gl;
    this.mesh = squareMesh(gl);
    this.textureManager = TextureManager.getInstance(gl);
    this.level = level;
    this.lastPosition = new Vector3(0, 0, 0);

    store.dispatch(gameActions.setLives(PLAYER_LIVES));
  }

  public pause() {
    this.dodgeTimeout?.pause();
    this.dodgeTimerInterval?.pause();
  }

  public resume() {
    this.dodgeTimeout?.resume();
    this.dodgeTimerInterval?.resume();
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
        alphaMultiplier: this.isDodging ? 0.5 : 1,
      },
      camera,
    });
  }

  public update() {
    // Update invincibility timer
    if (this.isInvincible) {
      this.invincibilityTimer++;
      if (this.invincibilityTimer >= this.invincibilityDuration && !this.isDodging) {
        this.isInvincible = false;
        this.invincibilityTimer = 0;
      }
    }

    // Dodge rotation
    if (this.isDodging) {
      this.rotation.z += 0.1;
    }

    let vx = 0;
    let vy = 0;
    const ax = this.walkSpeed;

    if (this.keysDown.has('w')) {
      vy += ax;
    }
    if (this.keysDown.has('s')) {
      vy -= ax;
    }
    if (this.keysDown.has('a')) {
      vx -= ax;
    }
    if (this.keysDown.has('d')) {
      vx += ax;
    }

    if (vx === 0 && vy === 0) {
      return;
    }

    // Calculate new position
    const newPosition = new Vector3(this.position.x + vx, this.position.y + vy, this.position.z);

    // Check if new position is walkable
    const newX = Math.round(newPosition.x);
    const newY = Math.round(newPosition.y);

    if (this.level.isWalkable(newX, newY)) {
      // Calculate distance traveled
      const distance = Math.sqrt(
        Math.pow(newPosition.x - this.lastPosition.x, 2) + Math.pow(newPosition.y - this.lastPosition.y, 2),
      );
      this.totalDistanceTraveled += distance;

      this.position.x = newPosition.x;
      this.position.y = newPosition.y;
      this.position.z = newPosition.z;
      if (!this.isDodging) {
        this.rotation.z = -Math.atan2(vx, vy);
      }

      // Update last position
      this.lastPosition.x = this.position.x;
      this.lastPosition.y = this.position.y;
      this.lastPosition.z = this.position.z;
    } else {
      // Try moving only on X axis
      const xOnlyPosition = new Vector3(this.position.x + vx, this.position.y, this.position.z);
      const xOnlyX = Math.round(xOnlyPosition.x);
      const xOnlyY = Math.round(xOnlyPosition.y);

      if (this.level.isWalkable(xOnlyX, xOnlyY)) {
        // Calculate distance traveled
        const distance = Math.sqrt(
          Math.pow(xOnlyPosition.x - this.lastPosition.x, 2) + Math.pow(xOnlyPosition.y - this.lastPosition.y, 2),
        );
        this.totalDistanceTraveled += distance;

        this.position.x = xOnlyPosition.x;
        this.position.y = xOnlyPosition.y;
        this.position.z = xOnlyPosition.z;
        if (!this.isDodging) {
          this.rotation.z = -Math.atan2(vx, 0);
        }
        // Update last position
        this.lastPosition.x = this.position.x;
        this.lastPosition.y = this.position.y;
        this.lastPosition.z = this.position.z;
      } else {
        // Try moving only on Y axis
        const yOnlyPosition = new Vector3(this.position.x, this.position.y + vy, this.position.z);
        const yOnlyX = Math.round(yOnlyPosition.x);
        const yOnlyY = Math.round(yOnlyPosition.y);

        if (this.level.isWalkable(yOnlyX, yOnlyY)) {
          // Calculate distance traveled
          const distance = Math.sqrt(
            Math.pow(yOnlyPosition.x - this.lastPosition.x, 2) + Math.pow(yOnlyPosition.y - this.lastPosition.y, 2),
          );
          this.totalDistanceTraveled += distance;

          this.position.x = yOnlyPosition.x;
          this.position.y = yOnlyPosition.y;
          this.position.z = yOnlyPosition.z;
          if (!this.isDodging) {
            this.rotation.z = -Math.atan2(0, vy);
          }
          // Update last position
          this.lastPosition.x = this.position.x;
          this.lastPosition.y = this.position.y;
          this.lastPosition.z = this.position.z;
        }
      }
    }
  }

  public get canDodge(): boolean {
    return !this.isDodging && !this.isOnDodgeCooldown;
  }

  public get shouldTakeDamage(): boolean {
    return !this.isInvincible && !this.isDodging;
  }

  public dodge() {
    if (!this.canDodge) {
      return;
    }

    this.isDodging = true;
    this.isOnDodgeCooldown = true;

    store.dispatch(
      gameActions.updateDodgeState({
        canDodge: false,
        isDodging: true,
        isOnCooldown: true,
        cooldownRemainingMs: Player.dodgeCooldownMs + Player.dodgeDurationMs,
      }),
    );

    if (this.dodgeTimeout) {
      this.dodgeTimeout.clear();
      this.dodgeTimeout = null;
    }

    if (this.dodgeTimerInterval) {
      this.dodgeTimerInterval.clear();
      this.dodgeTimerInterval = null;
    }

    this.dodgeTimerInterval = new PausableInterval(() => {
      const remainingTime = store.getState().game.dodgeState.cooldownRemainingMs;
      if (remainingTime >= 0) {
        store.dispatch(
          gameActions.updateDodgeState({
            cooldownRemainingMs: remainingTime - 1000,
          }),
        );
      }
    }, 1000);

    this.dodgeTimeout = new PausableTimeout(() => {
      this.isDodging = false;
      this.dodgeTimeout = null;
      store.dispatch(
        gameActions.updateDodgeState({
          isDodging: false,
          isOnCooldown: true,
          cooldownRemainingMs: Player.dodgeCooldownMs,
        }),
      );

      setTimeout(() => {
        this.isOnDodgeCooldown = false;

        store.dispatch(
          gameActions.updateDodgeState({
            isDodging: false,
            isOnCooldown: true,
            cooldownRemainingMs: Player.dodgeCooldownMs,
            canDodge: true,
          }),
        );

        if (this.dodgeTimerInterval) {
          this.dodgeTimerInterval.clear();
        }
      }, Player.dodgeCooldownMs);
    }, Player.dodgeDurationMs);
  }

  public takeDamage(): boolean {
    if (!this.shouldTakeDamage) {
      return false; // No damage taken during invincibility
    }

    if (!this.devOptions.godMode) {
      this.lives--;
    }

    if (this.lives > 0) {
      soundService.playSound('hit');
    }

    this.isInvincible = true;
    this.invincibilityTimer = 0;
    this.flashTimer = 0;
    return true; // Damage was taken
  }

  public getLives(): number {
    return this.lives;
  }

  public getTotalDistanceTraveled(): number {
    return this.totalDistanceTraveled;
  }

  public setLevel(level: Level) {
    this.level = level;
  }

  private keysDown = new Set<string>();

  public onKeyDown(event: KeyboardEvent) {
    if (this.keysDown.has(event.key.toLowerCase())) {
      return;
    }
    this.keysDown.add(event.key.toLowerCase());
  }

  public onKeyUp(event: KeyboardEvent) {
    this.keysDown.delete(event.key.toLowerCase());
  }

  public destroy(): void {
    // Clean up mesh resources
    if (this.mesh) {
      this.mesh.destroy(this.gl);
    }
  }
}
