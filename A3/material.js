// Base materials (no texture)
import { vertexShader, fragmentShader } from "./shaders.js";
export const gouraudMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, shininess: 30 });
export const phongMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 150, specular: 0x333333 });

export const shininessValues = [10, 30, 60, 90, 120, 150, 180, 210, 240];
export const diffuseReflectances = [
    0.1, 0.56, 0.67, 0.78, 0.82, 0.45, 0.93, 0.72, 0.88
];

// Shader Material Creation
export function createShaderMaterial(index) {
    return new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
            shadingMode: { value: 0 },
            textureMap: { value: null },
            useTexture: { value: 0 },
            lightPositions: { value: [] },
            lightColors: { value: [] },
            numLights: { value: 0 },
            diffuseReflectance: { value: diffuseReflectances[index % diffuseReflectances.length] },
            ambientColor: { value: new THREE.Color(0.2, 0.2, 0.2) },
            shininess: { value: shininessValues[index % shininessValues.length] }
        },
        glslVersion: THREE.GLSL1
    });
}
