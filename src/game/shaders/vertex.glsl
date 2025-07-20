precision mediump float;

attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec4 aColor;

uniform mat4 vModel;
uniform mat4 vView;
uniform mat4 vProjection;

varying vec3 passNormal;
varying vec3 passFragPos;
varying vec4 passColor;

void main() {
    gl_Position = vProjection * vView * vModel * vec4(aPosition, 1.0);
    passNormal = normalize(vec3(vModel * vec4(aNormal, 0.0)));
    passFragPos = vec3(vModel * vec4(aPosition, 1.0));
    passColor = aColor;
}