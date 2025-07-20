import { Vector3 } from '../math';

export class Mesh {
  vertices: Vertex[];
  indices: number[];

  pbo: WebGLBuffer | null;
  nbo: WebGLBuffer | null;
  tbo: WebGLBuffer | null;

  ibo: WebGLBuffer | null;
  vertexCount: number;

  constructor(gl: WebGLRenderingContext, vertices: Vertex[], indices: number[]) {
    this.vertices = vertices;
    this.indices = indices;

    this.pbo = gl.createBuffer();
    this.nbo = gl.createBuffer();
    this.tbo = gl.createBuffer();
    this.ibo = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.pbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices.flatMap(v => Object.values(v.position))), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.nbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices.flatMap(v => Object.values(v.normal))), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.tbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices.flatMap(v => v.textureCoord)), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    this.vertexCount = this.indices.length;
  }

  mesh() {
    return {
      pbo: this.pbo,
      nbo: this.nbo,
      tbo: this.tbo,
      ibo: this.ibo,
      vertexCount: this.vertexCount
    };
  }
}

export class Vertex {
  position: Vector3;
  normal: Vector3;
  textureCoord: [number, number];

  constructor(position: Vector3, normal: Vector3, textureCoord: [number, number]) {
    this.position = position;
    this.normal = normal;
    this.textureCoord = textureCoord;
  }
}
