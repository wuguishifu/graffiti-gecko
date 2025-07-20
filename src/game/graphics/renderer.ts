import { mat4 } from 'gl-matrix';
import { Vector3 } from '../math';
import { Camera } from './camera';
import { Mesh } from './mesh';

type RenderProps = {
  gl: WebGLRenderingContext;
  info: {
    program: WebGLProgram,
    attributes: { [name: string]: number },
    uniforms: { [name: string]: WebGLUniformLocation }
  }
  object: {
    mesh: Mesh;
    model: {
      position: Vector3,
      rotation: Vector3,
      scale: Vector3
    }
  }
  camera: Camera;
}

export default function renderObject({ gl, object: { mesh, model }, camera, info }: RenderProps) {
  const modelMatrix = mat4.create();
  mat4.translate(modelMatrix, modelMatrix, model.position.toReadonlyVec3());
  mat4.rotateX(modelMatrix, modelMatrix, model.rotation.x);
  mat4.rotateY(modelMatrix, modelMatrix, model.rotation.y);
  mat4.rotateZ(modelMatrix, modelMatrix, model.rotation.z);
  mat4.scale(modelMatrix, modelMatrix, model.scale.toReadonlyVec3());

  gl.useProgram(info.program);

  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.pbo);
  gl.vertexAttribPointer(info.attributes['aPosition'], 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(info.attributes['aPosition']);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.nbo);
  gl.vertexAttribPointer(info.attributes['aNormal'], 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(info.attributes['aNormal']);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.cbo);
  gl.vertexAttribPointer(info.attributes['aColor'], 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(info.attributes['aColor']);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  gl.uniformMatrix4fv(info.uniforms['vView'], false, camera.viewMatrix());
  gl.uniformMatrix4fv(info.uniforms['vProjection'], false, camera.projectionMatrix());
  gl.uniformMatrix4fv(info.uniforms['vModel'], false, modelMatrix);
  gl.uniform3fv(info.uniforms['viewPos'], camera.position.toArray());

  gl.uniform3fv(info.uniforms['lightPos'], [0, 5, 0]);
  gl.uniform3fv(info.uniforms['lightColor'], [1, 1, 1]);
  gl.uniform1f(info.uniforms['lightLevel'], 1.0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
  gl.drawElements(gl.TRIANGLES, mesh.vertexCount, gl.UNSIGNED_SHORT, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  gl.disableVertexAttribArray(info.attributes['aPosition']);
  gl.disableVertexAttribArray(info.attributes['aNormal']);
  gl.disableVertexAttribArray(info.attributes['aColor']);

  gl.useProgram(null);
};
