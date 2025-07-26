precision mediump float;

varying vec2 passTextureCoord;

uniform sampler2D uTexture;
uniform bool useTexture;

void main(void) {
  vec3 color;
  float alpha = 1.0;

  if (useTexture) {
    vec4 texColor = texture2D(uTexture, passTextureCoord);
    color = texColor.rgb;
    alpha = texColor.a;
  } else {
    color = vec3(0.5, 0.5, 0.5);
  }

  gl_FragColor = vec4(color, alpha);
}
