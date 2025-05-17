// Vertex Shader
export const vertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vColor;

uniform int shadingMode;
uniform vec3 lightPositions[3];
uniform vec3 lightColors[3];
uniform int numLights;
uniform vec3 ambientColor;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vPosition = worldPosition.xyz;
    
    // Gouraud shading calculations
    if(shadingMode == 0) {
        vColor = ambientColor;
        for(int i = 0; i < 3; i++) {
            if(i >= numLights) break;
            
            vec3 lightDir = normalize(lightPositions[i] - vPosition);
            float diff = max(dot(vNormal, lightDir), 0.0);
            vColor += diff * lightColors[i];
        }
    }
    
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}`;

// Fragment Shader
export const fragmentShader = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vColor;

uniform int shadingMode;
uniform sampler2D textureMap;
uniform int useTexture;
uniform vec3 lightPositions[3];
uniform vec3 lightColors[3];
uniform int numLights;
uniform vec3 ambientColor;
uniform float shininess;

void main() {
    vec3 finalColor = ambientColor;
    
    if(shadingMode == 1) { // Phong shading
        vec3 normal = normalize(vNormal);
        
        for(int i = 0; i < 3; i++) {
            if(i >= numLights) break;
            
            vec3 lightDir = normalize(lightPositions[i] - vPosition);

            // Diffuse
            float diff = max(dot(normal, lightDir), 0.0);
            finalColor += diff * lightColors[i];
            
            // Specular
            vec3 viewDir = normalize(-vPosition);
            vec3 halfwayDir = normalize(lightDir + viewDir);
            // vec3 reflectDir = reflect(-lightDir, normal);
            float spec = pow(max(dot(normal, halfwayDir), 0.0), shininess);
            finalColor += spec * lightColors[i];
        }
    } else { // Gouraud shading
        finalColor = vColor;
    }
    
    if(useTexture == 1) {
        vec4 texColor = texture2D(textureMap, vUv);
        finalColor *= texColor.rgb;
    }
    
    gl_FragColor = vec4(finalColor, 1.0);
}`;
