precision mediump float;

varying vec3 passNormal;
varying vec3 passFragPos;
varying vec2 passTextureCoord;

uniform vec3 viewPos;
uniform vec3 lightPos;
uniform float lightLevel;
uniform vec3 lightColor;
uniform sampler2D uTexture;
uniform sampler2D uTexture2;
uniform sampler2D uTexture3;
uniform sampler2D uTexture4;
uniform bool useTexture;
uniform float blendWeight1;
uniform float blendWeight2;
uniform float blendWeight3;
uniform float blendWeight4;

void main(void) {
    vec3 color;
    float alpha = 1.0;
    
    if (useTexture) {
        vec4 texColor1 = texture2D(uTexture, passTextureCoord);
        vec4 texColor2 = texture2D(uTexture2, passTextureCoord);
        vec4 texColor3 = texture2D(uTexture3, passTextureCoord);
        vec4 texColor4 = texture2D(uTexture4, passTextureCoord);
        
        // Blend textures based on weights
        vec4 blendedColor = texColor1 * blendWeight1 + 
                           texColor2 * blendWeight2 + 
                           texColor3 * blendWeight3 + 
                           texColor4 * blendWeight4;
        
        // Normalize the blend
        float totalWeight = blendWeight1 + blendWeight2 + blendWeight3 + blendWeight4;
        if (totalWeight > 0.0) {
            blendedColor = blendedColor / totalWeight;
        }
        
        color = blendedColor.rgb;
        alpha = blendedColor.a;
    } else {
        color = vec3(0.5, 0.5, 0.5);
    }

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
