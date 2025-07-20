precision mediump float;

varying vec3 passNormal;
varying vec3 passFragPos;
varying vec4 passColor;

uniform vec3 viewPos;

uniform vec3 lightPos;
uniform float lightLevel;
uniform vec3 lightColor;

void main(void) {
    vec3 color = vec3(passColor.xyz);
    float alpha = passColor.w;

    vec3 ambient = lightLevel * lightColor;
    vec3 lightDir = normalize(lightPos - passFragPos);
    float diff = max(dot(passNormal, lightDir), 0.0);
    vec3 diffuse = diff * lightColor;

    float specularStrength = 1.0;
    vec3 viewDir = normalize(viewPos - passFragPos);
    vec3 reflectDir = reflect(-lightDir, passNormal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    vec3 specular = specularStrength * spec * lightColor;

    vec3 colorResult = (ambient + diffuse + specular) * color;

    gl_FragColor = vec4(colorResult, alpha);
}