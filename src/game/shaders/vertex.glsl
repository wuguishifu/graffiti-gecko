precision mediump float;

attribute vec3 aPosition;
attribute vec2 aTextureCoord;

uniform mat4 vModel;
uniform mat4 vView;
uniform mat4 vProjection;

varying vec2 passTextureCoord;

void main() {
    gl_Position = vProjection * vView * vModel * vec4(aPosition, 1.0);
    passTextureCoord = aTextureCoord;
}
