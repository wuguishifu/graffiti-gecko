import { mat4 } from 'gl-matrix';

import { Vector3 } from '../math';
import { Camera } from './camera';
import { Mesh } from './mesh';
import { Texture } from './texture';

type ObjectModel = {
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
};

type ObjectData = {
  mesh: Mesh;
  model: ObjectModel;
  texture?: Texture;
  useTexture?: boolean;
  alphaMultiplier?: number;
};

type RenderProps = {
  gl: WebGLRenderingContext;
  info: {
    program: WebGLProgram;
    attributes: { [name: string]: number };
    uniforms: { [name: string]: WebGLUniformLocation };
  };
  object: ObjectData;
  camera: Camera;
};

type RenderGroupProps = {
  gl: WebGLRenderingContext;
  info: {
    program: WebGLProgram;
    attributes: { [name: string]: number };
    uniforms: { [name: string]: WebGLUniformLocation };
  };
  objects: {
    model: ObjectModel;
    alphaMultiplier?: number;
  }[];
  mesh: Mesh;
  texture?: Texture;
  useTexture?: boolean;
  camera: Camera;
};

export function renderObject({
  gl,
  object: { mesh, model, texture, useTexture = false, alphaMultiplier = 1.0 },
  camera,
  info,
}: RenderProps) {
  const modelMatrix = mat4.create();
  mat4.translate(modelMatrix, modelMatrix, model.position.toReadonlyVec3());
  mat4.rotateX(modelMatrix, modelMatrix, model.rotation.x);
  mat4.rotateY(modelMatrix, modelMatrix, model.rotation.y);
  mat4.rotateZ(modelMatrix, modelMatrix, model.rotation.z);
  mat4.scale(modelMatrix, modelMatrix, model.scale.toReadonlyVec3());

  gl.useProgram(info.program);

  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.pbo);
  gl.vertexAttribPointer(info.attributes.aPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(info.attributes.aPosition);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.nbo);
  gl.vertexAttribPointer(info.attributes.aNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(info.attributes.aNormal);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.tbo);
  gl.vertexAttribPointer(info.attributes.aTextureCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(info.attributes.aTextureCoord);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  if (texture && useTexture) {
    texture.bind(0);
    gl.uniform1i(info.uniforms.uTexture, 0);
    gl.uniform1i(info.uniforms.useTexture, 1);
  } else {
    gl.uniform1i(info.uniforms.useTexture, 0);
  }

  gl.uniformMatrix4fv(info.uniforms.vView, false, camera.viewMatrix());
  gl.uniformMatrix4fv(info.uniforms.vProjection, false, camera.projectionMatrix());
  gl.uniformMatrix4fv(info.uniforms.vModel, false, modelMatrix);
  gl.uniform3fv(info.uniforms.viewPos, camera.position.toArray());

  gl.uniform3fv(info.uniforms.lightPos, [0, 5, 0]);
  gl.uniform3fv(info.uniforms.lightColor, [1, 1, 1]);
  gl.uniform1f(info.uniforms.lightLevel, 1.0);
  gl.uniform1f(info.uniforms.alphaMultiplier, alphaMultiplier);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
  gl.drawElements(gl.TRIANGLES, mesh.vertexCount, gl.UNSIGNED_SHORT, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  gl.disableVertexAttribArray(info.attributes.aPosition);
  gl.disableVertexAttribArray(info.attributes.aNormal);
  gl.disableVertexAttribArray(info.attributes.aTextureCoord);

  gl.useProgram(null);
}

export function renderSimilarObjects({ gl, info, objects, mesh, camera, texture, useTexture }: RenderGroupProps) {
  gl.useProgram(info.program);

  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.pbo);
  gl.vertexAttribPointer(info.attributes.aPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(info.attributes.aPosition);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.nbo);
  gl.vertexAttribPointer(info.attributes.aNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(info.attributes.aNormal);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.tbo);
  gl.vertexAttribPointer(info.attributes.aTextureCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(info.attributes.aTextureCoord);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  gl.uniform3fv(info.uniforms.lightPos, [0, 5, 0]);
  gl.uniform3fv(info.uniforms.lightColor, [1, 1, 1]);
  gl.uniform1f(info.uniforms.lightLevel, 1.0);

  if (texture && useTexture) {
    texture.bind(0);
    gl.uniform1i(info.uniforms.uTexture, 0);
    gl.uniform1i(info.uniforms.useTexture, 1);
  } else {
    gl.uniform1i(info.uniforms.useTexture, 0);
  }

  gl.uniformMatrix4fv(info.uniforms.vView, false, camera.viewMatrix());
  gl.uniformMatrix4fv(info.uniforms.vProjection, false, camera.projectionMatrix());
  gl.uniform3fv(info.uniforms.viewPos, camera.position.toArray());

  for (const { model, alphaMultiplier = 1.0 } of objects) {
    const modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, model.position.toReadonlyVec3());
    mat4.rotateX(modelMatrix, modelMatrix, model.rotation.x);
    mat4.rotateY(modelMatrix, modelMatrix, model.rotation.y);
    mat4.rotateZ(modelMatrix, modelMatrix, model.rotation.z);
    mat4.scale(modelMatrix, modelMatrix, model.scale.toReadonlyVec3());
    gl.uniformMatrix4fv(info.uniforms.vModel, false, modelMatrix);
    gl.uniform1f(info.uniforms.alphaMultiplier, alphaMultiplier);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
    gl.drawElements(gl.TRIANGLES, mesh.vertexCount, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  gl.disableVertexAttribArray(info.attributes.aPosition);
  gl.disableVertexAttribArray(info.attributes.aNormal);
  gl.disableVertexAttribArray(info.attributes.aTextureCoord);

  gl.useProgram(null);
}
