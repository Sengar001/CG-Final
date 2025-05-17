export function setupLights(scene) {
  const ambient = new THREE.AmbientLight(0x333333);
  scene.add(ambient);

  const pointLight1 = new THREE.PointLight(0xff0000, 3, 40, Math.PI / 8);
  pointLight1.position.set(0, 25, 0);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0x00ff00, 1, 130);
  pointLight2.position.set(0, 20, 0);
  scene.add(pointLight2);

  const directionalLight = new THREE.DirectionalLight(0x333333, 0.5);
  directionalLight.position.set(0, 20, 0);
  scene.add(directionalLight);

  const movingSpot = new THREE.SpotLight(0x0000ff, 1, 100, Math.PI / 12);
  movingSpot.position.set(0, 30, 0);
  scene.add(movingSpot, movingSpot.target);

  return { pointLight1, pointLight2, movingSpot };
}
