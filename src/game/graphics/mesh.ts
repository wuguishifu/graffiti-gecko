import { Vector3 } from '../math';

export class Mesh {
  vertices: Vertex[];
  indices: number[];

  pbo: WebGLBuffer;
  tbo: WebGLBuffer;

  ibo: WebGLBuffer;
  vertexCount: number;

  constructor(gl: WebGLRenderingContext, vertices: Vertex[], indices: number[]) {
    this.vertices = vertices;
    this.indices = indices;

    this.pbo = gl.createBuffer();
    this.tbo = gl.createBuffer();
    this.ibo = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.pbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.vertices.flatMap((v) => Object.values(v.position))),
      gl.STATIC_DRAW,
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, this.tbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices.flatMap((v) => v.textureCoord)), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    this.vertexCount = this.indices.length;
  }

  mesh() {
    return {
      pbo: this.pbo,
      tbo: this.tbo,
      ibo: this.ibo,
      vertexCount: this.vertexCount,
    };
  }

  destroy(gl: WebGLRenderingContext): void {
    if (this.pbo) {
      gl.deleteBuffer(this.pbo);
    }
    if (this.tbo) {
      gl.deleteBuffer(this.tbo);
    }
    if (this.ibo) {
      gl.deleteBuffer(this.ibo);
    }
  }
}

export class Vertex {
  position: Vector3;
  textureCoord: [number, number];

  constructor(position: Vector3, textureCoord: [number, number]) {
    this.position = position;
    this.textureCoord = textureCoord;
  }
}

const squareVertices = [
  new Vertex(new Vector3(-0.5, -0.5, 0), [1, 0]),
  new Vertex(new Vector3(0.5, -0.5, 0), [0, 0]),
  new Vertex(new Vector3(0.5, 0.5, 0), [0, 1]),
  new Vertex(new Vector3(-0.5, 0.5, 0), [1, 1]),
];

const squareIndices = [0, 1, 2, 0, 2, 3];

let defaultSquareMesh: Mesh | null = null;

export function squareMesh(gl: WebGLRenderingContext): Mesh {
  if (defaultSquareMesh) {
    return defaultSquareMesh;
  }
  defaultSquareMesh = new Mesh(gl, squareVertices, squareIndices);
  return defaultSquareMesh;
}

export function resetSquareMesh(): void {
  if (defaultSquareMesh) {
    defaultSquareMesh = null;
  }
}
