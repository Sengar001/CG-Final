import { scene } from "./scene.js";
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
