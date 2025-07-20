import { Mesh, Vertex } from '../graphics/mesh';
import { RenderObject } from '../graphics/render-object';
import { Vector3, Vector4 } from '../math';

export class Tile extends RenderObject {
  public static mesh(gl: WebGLRenderingContext, color: Vector4): Mesh {
    const vertices = [
      new Vertex(new Vector3(-0.5, 0, -0.5), new Vector3(0, 1, 0), color),
      new Vertex(new Vector3(0.5, 0, -0.5), new Vector3(0, 1, 0), color),
      new Vertex(new Vector3(0.5, 0, 0.5), new Vector3(0, 1, 0), color),
      new Vertex(new Vector3(-0.5, 0, 0.5), new Vector3(0, 1, 0), color)
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
      this.defaultMesh = Tile.mesh(gl, new Vector4(1, 1, 1, 1));
    }
    return this.defaultMesh;
  }
}
