import { vertexShader, fragmentShader } from "./shader.js";

export const dominoColors = {
    initial: 0x00FFF,  // Bright blue (hex: #00BFFF)
    fallen: 0x8A2BE2
};

export const dominoMaterials = [
    createShaderMaterial(10, 0x222222),
    createShaderMaterial(30, 0x444444),
    createShaderMaterial(60, 0x666666),
    createShaderMaterial(90, 0x888888),
    createShaderMaterial(120, 0xaaaaaa)
];

function createShaderMaterial(shininess, specular) {
    return new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
            shadingMode: { value: 1 },
            lightPositions: { value: [] },
            lightColors: { value: [] },
            numLights: { value: 0 },
            ambientColor: { value: new THREE.Color(0x333333) },
            useTexture: { value: 0 },
            textureMap: { value: null },
            shininess: { value: shininess },
            uColor: { value: new THREE.Color(dominoColors.initial) },
            specularColor: { value: new THREE.Color(specular) }
        }
    });
}
