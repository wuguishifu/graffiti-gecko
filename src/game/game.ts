import { gameActions } from '../state/game-slice';
import { store } from '../state/store';
import { Camera } from './graphics/camera';
import { resetSquareMesh } from './graphics/mesh';
import { buildProgramInfo, initShaderProgram } from './graphics/shader-source';
import { TextureManager } from './graphics/texture-manager';
import type { ProgramInfo } from './graphics/types';
import { Vector3 } from './math';
import { Player } from './player/player';
import fsSource from './shaders/fragment.glsl?raw';
import vsSource from './shaders/vertex.glsl?raw';
import { Level } from './world/level';

import { DevSliceState } from '@/state/dev-slice';

export class Game {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private camera: Camera;
  private shaderProgram: WebGLProgram;
  private programInfo: ProgramInfo;
  private player: Player;
  private level: Level;
  private running = false;
  private static timerInterval: number | null = null;
  private static timerRunning = false;

  public pause(stopTimer = true) {
    this.running = false;
    if (stopTimer) {
      this.stopTimer();
    }
  }

  public resume() {
    if (!this.running) {
      this.running = true;
      this.startTimer();
      this.run();
    }
  }

  private boundKeyDown: (event: KeyboardEvent) => void;
  private boundKeyUp: (event: KeyboardEvent) => void;

  private onKeyDown(event: KeyboardEvent) {
    this.player.onKeyDown(event);

    if (event.key === 'Escape') {
      if (store.getState().game.sprayAreaVisible) {
        return store.dispatch(gameActions.setSprayAreaVisible(false));
      }

      if (store.getState().game.pauseMenuVisible) {
        return store.dispatch(gameActions.setPauseMenuVisible(false));
      }

      store.dispatch(gameActions.setPauseMenuVisible(true));
    }
  }

  private onKeyUp(event: KeyboardEvent) {
    this.player.onKeyUp(event);
  }

  private startTimer() {
    if (Game.timerRunning) {
      return;
    }
    Game.timerRunning = true;
    if (Game.timerInterval !== null) {
      return;
    }
    Game.timerInterval = window.setInterval(() => {
      if (!Game.timerRunning) {
        return;
      }
      const state = store.getState();
      const timeLeft = state.game.timeLeft;
      if (timeLeft > 0) {
        store.dispatch(gameActions.setTimeLeft(timeLeft - 1));
        if (timeLeft - 1 === 0) {
          store.dispatch(gameActions.setGameOverFlag(true));
        }
      }
    }, 1000);
  }

  private stopTimer() {
    if (Game.timerInterval) {
      clearInterval(Game.timerInterval);
      Game.timerInterval = null;
      Game.timerRunning = false;
    }
  }

  constructor(
    canvas: HTMLCanvasElement,
    private devOptions: DevSliceState,
  ) {
    store.dispatch(gameActions.setTimeLeft(devOptions.overrideTotalTime || 300));

    this.canvas = canvas;
    const gl = canvas.getContext('webgl', { antialias: false });
    if (!gl) {
      throw new Error('WebGL not supported');
    }
    this.gl = gl;

    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);

    this.gl.depthMask(false);
    this.gl.clearDepth(1);

    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);

    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clearDepth(1);

    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    this.shaderProgram = initShaderProgram(this.gl, vsSource, fsSource);
    this.programInfo = {
      ...buildProgramInfo(this.gl, this.shaderProgram),
      program: this.shaderProgram,
    };

    // Get current level from store
    const currentLevel = store.getState().game.currentLevel;
    this.level = new Level(this.gl, currentLevel, this.devOptions);

    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
    document.addEventListener('keydown', this.boundKeyDown);
    document.addEventListener('keyup', this.boundKeyUp);

    // Pass the level reference to the player
    this.player = new Player(this.gl, this.level, this.devOptions);

    // Set player reference in level for cop spawning
    this.level.setPlayer(this.player);
    this.level.spawnEntities();
    this.camera = new Camera(this.canvas.clientWidth / this.canvas.clientHeight, this.player);

    this.running = true;
    this.setup().then(() => {
      this.startTimer();
      this.run();
    });
  }

  public async setup() {
    const textureManager = TextureManager.getInstance(this.gl);
    await Promise.all([
      textureManager.preloadAllTileTextures(),
      textureManager.preloadEntityTexture('gecko'),
      textureManager.preloadEntityTexture('spray-can'),
      textureManager.preloadEntityTexture('cop'),
    ]);
  }

  public run() {
    if (!this.running) {
      return;
    }
    this.camera.update();
    this.player.update();

    if (!this.devOptions.disableCopAi) {
      this.level.updateCops();
      this.checkPlayerNearCops();
    }

    this.checkPlayerNearSprayCan();
    this.checkLevelCompletion();
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.render();
    requestAnimationFrame(() => this.run());
  }

  public render() {
    this.level.render(this.gl, this.programInfo, this.camera);
    this.player.render(this.gl, this.programInfo, this.camera);
  }

  private lastSprayCanCheckValue = false;
  private lastSprayCanId = -1;
  private checkPlayerNearSprayCan() {
    const sprayCans = this.level.getSprayCans();
    const playerPos = this.player.position;
    const detectionRadius = 1; // Distance within which player can interact with spray can

    const nearestSprayCan = sprayCans.find((sprayCan) => {
      if (sprayCan.isCompleted) {
        return false;
      }
      const distance = Math.sqrt(
        Math.pow(playerPos.x - sprayCan.position.x, 2) + Math.pow(playerPos.y - sprayCan.position.y, 2),
      );
      return distance <= detectionRadius;
    });
    const isNearSprayCan = !!nearestSprayCan;

    if (isNearSprayCan !== this.lastSprayCanCheckValue) {
      store.dispatch(gameActions.setNearSprayCan(isNearSprayCan));
      this.lastSprayCanCheckValue = isNearSprayCan;
    }

    if (isNearSprayCan && nearestSprayCan && nearestSprayCan.id !== this.lastSprayCanId) {
      console.log(`Player is near spray can with ID: ${nearestSprayCan.id}`);
      this.lastSprayCanId = nearestSprayCan.id;
      store.dispatch(gameActions.setActiveSprayCanId(nearestSprayCan.id));
    }
  }

  private checkPlayerNearCops() {
    const cops = this.level.getCops();
    const captureRadius = 1.0; // Distance within which cops can capture player

    const nearbyCop = cops.find((cop) => {
      return cop.isNearPlayer(captureRadius);
    });

    if (nearbyCop) {
      // Check if player takes damage
      if (this.player.takeDamage()) {
        console.log(`Player took damage! Lives remaining: ${this.player.getLives()}`);

        if (this.player.getLives() === 0) {
          store.dispatch(gameActions.setGameOverFlag(true));
          store.dispatch(gameActions.setDistanceTraveled(this.player.getTotalDistanceTraveled()));
        }

        // Update game state
        store.dispatch(gameActions.setLives(this.player.getLives()));

        // Make all cops flee
        cops.forEach((cop) => {
          cop.startFleeing();
        });
      }
    }
  }

  public completeSprayCan(id: number) {
    const sprayCans = this.level.getSprayCans();
    const active = sprayCans.find((sprayCan) => sprayCan.id === id);
    if (active) {
      active.isCompleted = true;
    }
  }

  private checkLevelCompletion() {
    const sprayCans = this.level.getSprayCans();
    const allCompleted = sprayCans.length > 0 && sprayCans.every((sprayCan) => sprayCan.isCompleted);

    if (allCompleted) {
      console.log('Level completed! Generating next level...');
      console.log(`Completed ${sprayCans.length} spray cans in this level`);
      console.log(`Total completed so far: ${store.getState().game.totalSprayCansCompleted}`);

      // Increment level in store
      store.dispatch(gameActions.incrementLevel());
      const newLevel = store.getState().game.currentLevel;

      // Generate new level with increased difficulty
      this.level.destroy();
      this.level = new Level(this.gl, newLevel, this.devOptions);

      this.player.position = this.level.getRandomStoneTile() ?? new Vector3(0, 0, 0);
      this.player.setLevel(this.level);

      this.level.setPlayer(this.player);
      this.level.spawnEntities();

      console.log(`Generated level ${newLevel} with increased difficulty`);
    }
  }

  public destroy() {
    // Stop the game loop
    this.running = false;
    this.stopTimer();

    // Remove event listeners
    document.removeEventListener('keydown', this.boundKeyDown);
    document.removeEventListener('keyup', this.boundKeyUp);

    this.gl.deleteProgram(this.shaderProgram);
    this.level.destroy();
    this.player.destroy();

    // Reset TextureManager instance to allow proper cleanup
    TextureManager.resetInstance();

    // Reset shared mesh resources
    resetSquareMesh();
  }
}
