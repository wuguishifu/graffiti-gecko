import { Vector3, Vector4 } from '../math';

export class Mesh {
  vertices: Vertex[];
  indices: number[];

  pbo: WebGLBuffer | null;
  nbo: WebGLBuffer | null;
  cbo: WebGLBuffer | null;

  ibo: WebGLBuffer | null;
  vertexCount: number;

  constructor(gl: WebGLRenderingContext, vertices: Vertex[], indices: number[]) {
    this.vertices = vertices;
    this.indices = indices;

    this.pbo = gl.createBuffer();
    this.nbo = gl.createBuffer();
    this.cbo = gl.createBuffer();
    this.ibo = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.pbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices.flatMap(v => Object.values(v.position))), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.nbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices.flatMap(v => Object.values(v.normal))), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.cbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices.flatMap(v => Object.values(v.color))), gl.STATIC_DRAW);

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
      cbo: this.cbo,
      ibo: this.ibo,
      vertexCount: this.vertexCount
    };
  }
}

export class Vertex {
  position: Vector3;
  normal: Vector3;
  color: Vector4;

  constructor(position: Vector3, normal: Vector3, color: Vector4) {
    this.position = position;
    this.normal = normal;
    this.color = color;
  }
}

export class Triangle {
  v1: Vector3;
  v2: Vector3;
  v3: Vector3;
  normal: Vector3;

  constructor(v1: Vector3, v2: Vector3, v3: Vector3, normal?: Vector3) {
    this.v1 = v1;
    this.v2 = v2;
    this.v3 = v3;
    this.normal = normal || new Vector3(0, 1, 0); // default to up
  }
}
