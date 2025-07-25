import type { ReadonlyVec3, ReadonlyVec4 } from 'gl-matrix';

export class Vector4 {
  x: number;
  y: number;
  z: number;
  w: number;

  constructor(x: number, y: number, z: number, w: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  toReadonlyVec4() {
    return Object.freeze([this.x, this.y, this.z, this.w]) as ReadonlyVec4;
  }

  toArray() {
    return [this.x, this.y, this.z, this.w];
  }

  static equals(v1: Vector4, v2: Vector4) {
    return v1.x === v2.x && v1.y === v2.y && v1.z === v2.z && v1.w === v2.w;
  }

  static equalsFn(v1: Vector4) {
    return (v2: Vector4) => Vector4.equals(v1, v2);
  }

  static add(v1: Vector4, v2: Vector4) {
    return new Vector4(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z, v1.w + v2.w);
  }

  static subtract(v1: Vector4, v2: Vector4) {
    return new Vector4(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z, v1.w - v2.w);
  }

  static scale(v: Vector4, s: number) {
    return new Vector4(v.x * s, v.y * s, v.z * s, v.w * s);
  }

  static magnitude(v: Vector4) {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z + v.w * v.w);
  }

  static dot(v1: Vector4, v2: Vector4) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z + v1.w * v2.w;
  }
}

export class Vector3 {
  x: number;
  y: number;
  z: number;

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  static from(v: Vector3) {
    return new Vector3(v.x, v.y, v.z);
  }

  toReadonlyVec3() {
    return Object.freeze([this.x, this.y, this.z]) as ReadonlyVec3;
  }

  toArray() {
    return [this.x, this.y, this.z];
  }

  static normalize(v: Vector3) {
    const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    return new Vector3(v.x / length, v.y / length, v.z / length);
  }

  static equals(v1: Vector3, v2: Vector3) {
    return v1.x === v2.x && v1.y === v2.y && v1.z === v2.z;
  }

  static equalsFn(v1: Vector3) {
    return (v2: Vector3) => Vector3.equals(v1, v2);
  }

  static add(v1: Vector3, v2: Vector3) {
    return new Vector3(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
  }

  public add(v: Vector3) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  static subtract(v1: Vector3, v2: Vector3) {
    return new Vector3(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
  }

  public subtract(v: Vector3) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  static cross(v1: Vector3, v2: Vector3) {
    return new Vector3(v1.y * v2.z - v1.z * v2.y, v1.z * v2.x - v1.x * v2.z, v1.x * v2.y - v1.y * v2.x);
  }

  static scale(v: Vector3, s: number) {
    return new Vector3(v.x * s, v.y * s, v.z * s);
  }

  public scale(s: number) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }

  static magnitude(v: Vector3) {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  }

  static dot(v1: Vector3, v2: Vector3) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  }

  static angle(v1: Vector3, v2: Vector3) {
    return Math.acos(Vector3.dot(v1, v2) / (Vector3.magnitude(v1) * Vector3.magnitude(v2)));
  }
}

export const lerp = (a: number, b: number, t: number) => a + (1 / t) * (b - a);
