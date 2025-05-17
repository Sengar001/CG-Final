import { scene, dominos } from "./scene.js";
// Lights
export const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

export const pointLight1 = new THREE.PointLight(0xff0000, 1, 20);
pointLight1.position.set(5, 10, 5);
pointLight1.castShadow = true;
scene.add(pointLight1);

export const pointLight2 = new THREE.PointLight(0x00ff00, 1, 20);
pointLight2.position.set(-5, 10, -5);
pointLight2.castShadow = true;
scene.add(pointLight2);

export const directionalLight = new THREE.DirectionalLight(0x333333, 0.5);
directionalLight.position.set(0, 20, 0);
scene.add(directionalLight);

// Add this to your animation loop:
export function updateLights() {
    const activeLights = [];
    if (pointLight1.visible) activeLights.push(pointLight1);
    if (pointLight2.visible) activeLights.push(pointLight2);
    if (directionalLight.visible) activeLights.push(directionalLight);

    dominos.forEach(domino => {
        const uniforms = domino.material.uniforms;
        const lightPositions = [];
        const lightColors = [];

        activeLights.forEach(light => {
            lightPositions.push(light.position.clone());
            lightColors.push(light.color.clone());
        });

        // Pad arrays to 3 elements
        while (lightPositions.length < 3) lightPositions.push(new THREE.Vector3());
        while (lightColors.length < 3) lightColors.push(new THREE.Color(0, 0, 0));

        uniforms.lightPositions.value = lightPositions;
        uniforms.lightColors.value = lightColors;
        uniforms.numLights.value = activeLights.length;
    });
}