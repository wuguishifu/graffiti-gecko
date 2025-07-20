import { mat4 } from 'gl-matrix';
import { Vector3 } from '../math';
import { Camera } from './camera';
import { Mesh } from './mesh';
import { Texture } from './texture';

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
    texture?: Texture;
    blendTextures?: { texture: Texture; weight: number }[];
    useTexture?: boolean;
  }
  camera: Camera;
}

export default function renderObject({ gl, object: { mesh, model, texture, blendTextures, useTexture = false }, camera, info }: RenderProps) {
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

  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.tbo);
  gl.vertexAttribPointer(info.attributes['aTextureCoord'], 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(info.attributes['aTextureCoord']);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  if (useTexture) {
    if (blendTextures && blendTextures.length > 1) {
      // Multi-texture blending
      blendTextures.forEach((blend, index) => {
        const textureUnit = index;
        blend.texture.bind(textureUnit);

        const uniformName = index === 0 ? 'uTexture' : `uTexture${index + 1}`;
        const weightName = `blendWeight${index + 1}`;

        if (info.uniforms[uniformName]) {
          gl.uniform1i(info.uniforms[uniformName], textureUnit);
        }
        if (info.uniforms[weightName]) {
          gl.uniform1f(info.uniforms[weightName], blend.weight);
        }
      });

      // Set remaining texture units to use the first texture to avoid undefined sampling
      for (let i = blendTextures.length; i < 4; i++) {
        const uniformName = i === 0 ? 'uTexture' : `uTexture${i + 1}`;
        const weightName = `blendWeight${i + 1}`;

        if (info.uniforms[uniformName]) {
          gl.uniform1i(info.uniforms[uniformName], 0);
        }
        if (info.uniforms[weightName]) {
          gl.uniform1f(info.uniforms[weightName], 0.0);
        }
      }

      gl.uniform1i(info.uniforms['useTexture'], 1);
    } else if (texture) {
      // Single texture
      texture.bind(0);
      gl.uniform1i(info.uniforms['uTexture'], 0);

      // Set other texture units to use the same texture with zero weight
      for (let i = 1; i < 4; i++) {
        const uniformName = `uTexture${i + 1}`;
        const weightName = `blendWeight${i + 1}`;

        if (info.uniforms[uniformName]) {
          gl.uniform1i(info.uniforms[uniformName], 0);
        }
        if (info.uniforms[weightName]) {
          gl.uniform1f(info.uniforms[weightName], 0.0);
        }
      }

      // Set primary texture weight to 1.0
      if (info.uniforms['blendWeight1']) {
        gl.uniform1f(info.uniforms['blendWeight1'], 1.0);
      }

      gl.uniform1i(info.uniforms['useTexture'], 1);
    }
  } else {
    gl.uniform1i(info.uniforms['useTexture'], 0);
  }

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
  gl.disableVertexAttribArray(info.attributes['aTextureCoord']);

  gl.useProgram(null);
};
