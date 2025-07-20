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
uniform bool useTexture;
uniform float blendFactor;
uniform vec2 tilePosition;

// Simple noise function
float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float smoothNoise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = noise(i);
    float b = noise(i + vec2(1.0, 0.0));
    float c = noise(i + vec2(0.0, 1.0));
    float d = noise(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main(void) {
    vec3 color;
    float alpha = 1.0;
    
    if (useTexture) {
        vec4 texColor1 = texture2D(uTexture, passTextureCoord);
        vec4 texColor2 = texture2D(uTexture2, passTextureCoord);
        
        // Generate noise-based blend factor
        float noiseValue = smoothNoise(passTextureCoord * 8.0 + tilePosition);
        float finalBlendFactor = mix(blendFactor, noiseValue, 0.3);
        
        vec4 blendedColor = mix(texColor1, texColor2, finalBlendFactor);
        
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
