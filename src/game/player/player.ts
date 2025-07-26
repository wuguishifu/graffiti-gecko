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
import type { Level } from '../world/level';

import { DevSliceState } from '@/state/dev-slice';

const PLAYER_LIVES = 3;

export class Player extends RenderObject {
  private walkSpeed = 0.04;
  private runSpeed = 0.08;
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
  private stamina = 100; // 0-100 percent
  private staminaDepleteRate = 0.7; // percent per frame while sprinting
  private staminaRegenRate = 0.3; // percent per frame while recovering
  private staminaRegenDelay = 60; // frames to wait after hitting 0 (1s at 60fps)
  private staminaRegenDelayTimer = 0;
  private lastEnergyPercent = 100;
  private energyUpdateThrottle = 6; // only update Redux every 6 frames
  private energyUpdateFrame = 0;
  private isDodging = false;
  private dodgeCooldownMs = 7000;
  private dodgeRotationInterval: NodeJS.Timeout | null = null;
  private dodgeTimeout: NodeJS.Timeout | null = null;
  private isOnDodgeCooldown = false;
  private dodgeDurationMs = 3000;

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

  public render(gl: WebGLRenderingContext, programInfo: ProgramInfo, camera: Camera) {
    // Flash effect during invincibility
    if (this.isInvincible || this.isDodging) {
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
      if (this.invincibilityTimer >= this.invincibilityDuration && !this.isDodging) {
        this.isInvincible = false;
        this.invincibilityTimer = 0;
      }
    }

    let vx = 0;
    let vy = 0;
    let ax = this.walkSpeed;
    const isTryingToSprint = this.keysDown.has('shift');
    const canSprint = isTryingToSprint && this.stamina > 0 && this.staminaRegenDelayTimer === 0;

    // Sprinting logic
    if (canSprint) {
      ax = this.runSpeed;
      if (!this.devOptions.unlimitedStamina) {
        this.stamina -= this.staminaDepleteRate;
      }
      if (this.stamina <= 0) {
        this.stamina = 0;
        this.staminaRegenDelayTimer = this.staminaRegenDelay;
      }
    } else {
      ax = this.walkSpeed;
      // Only start regen delay if we just hit 0 and are still trying to sprint
      if (this.stamina === 0 && isTryingToSprint && this.staminaRegenDelayTimer === 0) {
        this.staminaRegenDelayTimer = this.staminaRegenDelay;
      }
    }

    // Regen delay countdown
    if (this.staminaRegenDelayTimer > 0) {
      this.staminaRegenDelayTimer--;
    } else if (!canSprint && this.stamina < 100) {
      // Only regen if not sprinting and delay is over
      this.stamina += this.staminaRegenRate;
      if (this.stamina > 100) {
        this.stamina = 100;
      }
    }

    // Clamp stamina
    if (this.stamina < 0) {
      this.stamina = 0;
    }
    if (this.stamina > 100) {
      this.stamina = 100;
    }

    // Throttle Redux updates for energyPercent
    this.energyUpdateFrame = (this.energyUpdateFrame + 1) % this.energyUpdateThrottle;
    const roundedEnergy = Math.round(this.stamina);
    if (
      (roundedEnergy !== this.lastEnergyPercent && this.energyUpdateFrame === 0) ||
      (this.lastEnergyPercent !== roundedEnergy && (roundedEnergy === 0 || roundedEnergy === 100))
    ) {
      store.dispatch(gameActions.setEnergyPercent(roundedEnergy));
      this.lastEnergyPercent = roundedEnergy;
    }

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
  public dodge() {
    if (this.isDodging || this.isOnDodgeCooldown) {
      return;
    }

    this.isDodging = true;
    this.isInvincible = true;
    this.isOnDodgeCooldown = true;

    const rotationSpeed = 0.2;
    this.dodgeRotationInterval = setInterval(() => {
      this.rotation.z += rotationSpeed;
    }, 16);

    this.dodgeTimeout = setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      clearInterval(this.dodgeRotationInterval!);
      this.isDodging = false;
      // this.isInvincible = false;
    }, this.dodgeDurationMs);

    setTimeout(() => {
      this.isOnDodgeCooldown = false;
    }, this.dodgeCooldownMs);
  }

  public getDodging(): boolean {
    return this.isDodging;
  }

  public isInDodgeCooldown(): boolean {
    return this.isOnDodgeCooldown;
  }

  public takeDamage(): boolean {
    if (this.isInvincible) {
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

  public isInvulnerable(): boolean {
    return this.isInvincible;
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
