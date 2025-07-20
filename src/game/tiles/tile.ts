import { Mesh, Vertex } from '../graphics/mesh';
import { RenderObject } from '../graphics/render-object';
import { Vector3 } from '../math';

export class Tile extends RenderObject {
  public static mesh(gl: WebGLRenderingContext): Mesh {
    const vertices = [
      new Vertex(new Vector3(-0.5, 0, -0.5), new Vector3(0, 1, 0), [0, 0]),
      new Vertex(new Vector3(0.5, 0, -0.5), new Vector3(0, 1, 0), [1, 0]),
      new Vertex(new Vector3(0.5, 0, 0.5), new Vector3(0, 1, 0), [1, 1]),
      new Vertex(new Vector3(-0.5, 0, 0.5), new Vector3(0, 1, 0), [0, 1])
    ];

    return new Mesh(gl, vertices, [
      0, 1, 2,
      0, 2, 3
    ]);
  }

  constructor(position: Vector3, rotation: Vector3, scale: Vector3) {
    super(position, rotation, scale);
  }

  private defaultMesh: Mesh | null = null;
  public mesh(gl: WebGLRenderingContext): Mesh {
    if (!this.defaultMesh) {
      this.defaultMesh = Tile.mesh(gl);
    }
    return this.defaultMesh;
  }
}
