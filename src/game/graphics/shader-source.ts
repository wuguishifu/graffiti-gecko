export function buildProgramInfo(gl: WebGLRenderingContext, program: WebGLProgram) {
  const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
  const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

  const attributes: { [name: string]: number } = {};
  for (let i = 0; i < numAttributes; i++) {
    const info = gl.getActiveAttrib(program, i);
    if (!info) {
      continue;
    }
    attributes[info.name] = gl.getAttribLocation(program, info.name);
  }

  const uniforms: { [name: string]: WebGLUniformLocation } = {};
  for (let i = 0; i < numUniforms; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) {
      continue;
    }
    const uniformLocation = gl.getUniformLocation(program, info.name);
    if (uniformLocation) {
      uniforms[info.name] = uniformLocation;
    }
  }

  return { attributes, uniforms };
}

export function initShaderProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  if (!shaderProgram) {
    throw new Error('Unable to create a shader program. Your browser may not support WebGL.');
  }
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);

  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    throw new Error('Unable to link the shader program: ' + gl.getProgramInfoLog(shaderProgram));
  }

  return shaderProgram;
}

export function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Unable to create a shader. Your browser may not support WebGL.');
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    throw new Error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
  }

  return shader;
}
