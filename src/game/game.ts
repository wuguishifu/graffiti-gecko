import { gameActions } from '../state/gameSlice';
import { store } from '../state/store';
import { Camera } from './graphics/camera';
import { buildProgramInfo, initShaderProgram } from './graphics/shader-source';
import { TextureManager } from './graphics/texture-manager';
import type { ProgramInfo } from './graphics/types';
import { Player } from './player/player';

import fsSource from './shaders/fragment.glsl?raw';
import vsSource from './shaders/vertex.glsl?raw';
import { Level } from './world/level';

export class Game {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private camera: Camera;
  private shaderProgram: WebGLProgram;
  private programInfo: ProgramInfo;
  private player: Player;
  private level: Level;
  private running: boolean = false;

  public pause() {
    this.running = false;
  }

  public resume() {
    if (!this.running) {
      this.running = true;
      this.run();
    }
  }

  private boundKeyDown: (event: KeyboardEvent) => void;
  private boundKeyUp: (event: KeyboardEvent) => void;

  private onKeyDown(event: KeyboardEvent) {
    console.log(`Key pressed: ${event.key}`);
    this.player.onKeyDown(event);

    if (event.key === 'Escape') {
      store.dispatch(gameActions.setSprayAreaVisible(false));
    }

    if (event.key === ' ') {
      if (store.getState().game.nearSprayCan) {
        store.dispatch(gameActions.setSprayAreaVisible(true));
      }
    }
  }

  private onKeyUp(event: KeyboardEvent) {
    console.log(`Key released: ${event.key}`);
    this.player.onKeyUp(event);
  }

  constructor(canvas: HTMLCanvasElement) {
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

    this.level = new Level(this.gl);

    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
    document.addEventListener('keydown', this.boundKeyDown);
    document.addEventListener('keyup', this.boundKeyUp);

    // Pass the level reference to the player
    this.player = new Player(this.gl, this.level);
    this.camera = new Camera(this.canvas.clientWidth / this.canvas.clientHeight, this.player);

    this.running = true;
    this.setup().then(() => this.run());
  }

  public async setup() {
    const textureManager = TextureManager.getInstance(this.gl);
    await Promise.all([
      textureManager.preloadAllTileTextures(),
      textureManager.preloadEntityTexture('gecko'),
      textureManager.preloadEntityTexture('spray-can'),
    ]);
  }

  public run() {
    if (!this.running) {
      return;
    }
    this.camera.update();
    this.player.update();
    this.checkPlayerNearSprayCan();
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.render();
    requestAnimationFrame(() => this.run());
  }

  public render() {
    this.level.render(this.gl, this.programInfo, this.camera);
    this.player.render(this.gl, this.programInfo, this.camera);
  }

  private lastSprayCanCheckValue = false;
  private checkPlayerNearSprayCan() {
    const sprayCans = this.level.getSprayCans();
    const playerPos = this.player.position;
    const detectionRadius = 1.5; // Distance within which player can interact with spray can

    const isNearSprayCan = sprayCans.some(sprayCan => {
      const distance = Math.sqrt(
        Math.pow(playerPos.x - sprayCan.position.x, 2) +
        Math.pow(playerPos.y - sprayCan.position.y, 2)
      );
      return distance <= detectionRadius;
    });

    if (isNearSprayCan !== this.lastSprayCanCheckValue) {
      store.dispatch(gameActions.setNearSprayCan(isNearSprayCan));
      this.lastSprayCanCheckValue = isNearSprayCan;
    }
  }

  public destroy() {
    document.removeEventListener('keydown', this.boundKeyDown);
    document.removeEventListener('keyup', this.boundKeyUp);
  }
}
