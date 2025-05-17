
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
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }`;

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
    uniform vec3 uColor;
    
    void main() {
        vec3 finalColor = ambientColor * uColor;

            vec3 normal = normalize(vNormal);
            
            for(int i = 0; i < 3; i++) {
                if(i >= numLights) break;
                
                vec3 lightDir = normalize(lightPositions[i] - vPosition);
                
                // Diffuse
                float diff = max(dot(normal, lightDir), 0.0);
                finalColor += diff * lightColors[i] * uColor;
                
                // Specular
                vec3 viewDir = normalize(-vPosition);
                vec3 reflectDir = reflect(-lightDir, normal);
                float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
                finalColor += spec * lightColors[i];
            }
        
        if(useTexture == 1) {
            vec4 texColor = texture2D(textureMap, vUv);
            finalColor *= texColor.rgb;
        }
        
        gl_FragColor = vec4(finalColor, 1.0);
    }`;
