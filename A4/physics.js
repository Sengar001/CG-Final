// physics.js
import { dominoColors } from './config.js';
import { vertexShader, fragmentShader } from './shader.js';

const advanceThreshold = 1;

export function initPhysics() {
  const world = new CANNON.World();
  world.gravity.set(0, -9.82, 0);
  world.solver.iterations = 200;

  const dominoMaterial = new CANNON.Material();
  const groundMaterial = new CANNON.Material();
  const contact = new CANNON.ContactMaterial(dominoMaterial, groundMaterial, {
    friction: 0.8,
    restitution: 0.0,
    contactEquationStiffness: 1e8,
    contactEquationRelaxation: 10,
  });
  world.addContactMaterial(contact);

  return world;
}

export function updatePhysics(state) {
  state.world.step(1 / 60);

  state.dominoBodies.forEach((body, i) => {
    const mesh = state.dominoMeshes[i];
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);

    // Fallen color check
    if (state.animationStarted && !mesh.userData.hasFallen) {
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(mesh.quaternion);
      if (up.dot(new THREE.Vector3(0, 1, 0)) < 0.7) {
        mesh.userData.hasFallen = true;
        // mesh.material = mesh.material.clone();
        // mesh.material.color.set(dominoColors.fallen);
        const newMaterial = new THREE.ShaderMaterial({
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
          uniforms: THREE.UniformsUtils.clone(mesh.material.uniforms)
        });
        newMaterial.uniforms.uColor.value.set(dominoColors.fallen);
        mesh.material = newMaterial;
      }
    }

    // Follow target logic
    if (
      state.animationStarted &&
      body.velocity.length() > advanceThreshold &&
      !state.followTargets.includes(mesh) &&
      !state.rightBranch.has(mesh)
    ) {
      state.followTargets.push(mesh);
    }
  });

  // Sync ball physics
  if (state.ball) {
    state.ball.mesh.position.copy(state.ball.body.position);
    state.ball.mesh.quaternion.copy(state.ball.body.quaternion);
  }

  // Sync seesaw physics
  if (state.seesaw) {
    state.seesaw.mesh.position.copy(state.seesaw.body.position);
    state.seesaw.mesh.quaternion.copy(state.seesaw.body.quaternion);
  }

  // Re-add ball to follow targets
  if (
    state.followTargets.length > 0 &&
    state.followIndex >= state.followTargets.length - 1 &&
    state.ball &&
    !state.followTargets.includes(state.ball.mesh)
  ) {
    state.followTargets.push(state.ball.mesh);
  }
}
