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

  private boundKeyDown: (event: KeyboardEvent) => void;
  private boundKeyUp: (event: KeyboardEvent) => void;

  private onKeyDown(event: KeyboardEvent) {
    console.log(`Key pressed: ${event.key}`);
    this.player.onKeyDown(event);
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

    this.player = new Player(this.gl);
    this.camera = new Camera(this.canvas.clientWidth / this.canvas.clientHeight, this.player);

    this.setup().then(() => this.run());
  }

  public async setup() {
    const textureManager = TextureManager.getInstance(this.gl);
    await Promise.all([
      textureManager.preloadAllTileTextures(),
      textureManager.preloadEntityTexture('gecko'),
    ]);
  }

  public run() {
    this.camera.update();
    this.player.update();
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.render();
    requestAnimationFrame(() => this.run());
  }

  public render() {
    this.level.render(this.gl, this.programInfo, this.camera);
    this.player.render(this.gl, this.programInfo, this.camera);
  }

  public destroy() {
    document.removeEventListener('keydown', this.boundKeyDown);
    document.removeEventListener('keyup', this.boundKeyUp);
  }
}
