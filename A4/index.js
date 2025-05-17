import { setupScene } from "./sceneSetup.js";
import { initPhysics } from "./physics.js";
import { createGround, createDominoUTurn, createSeesaw, createPlank, createPlank1, createPlank2, createBallTrigger } from "./objectsCreation.js";
import { setupLights } from "./lights.js";
import { setupWindowResize, setupKeyHandlers } from "./controlsHandlers.js";
import { startAnimationLoop } from "./animationLoop.js";
import { state } from "./states.js";

function init() {
  const { scene, renderer, camera, followCamera, controls } = setupScene();
  Object.assign(state, {
    scene, renderer, camera, followCamera, controls, currentCamera: camera,
  });

  state.world = initPhysics();

  state.lights = setupLights(scene);

  createGround(scene, state.world, 100, 100);
  createDominoUTurn(scene, state.world, state.dominoBodies, state.dominoMeshes, state);
  createSeesaw(scene, state.world, state);
  createPlank(scene, state.world);
  createPlank1(scene, state.world, state.dominoBodies, state.dominoMeshes, state.updaters);
  createPlank2(scene, state.world, state.dominoBodies, state.dominoMeshes);
  state.ball = createBallTrigger(scene, state.world);
  state.followTargets = [state.ball.mesh];

  setupWindowResize(camera, followCamera, renderer);
  setupKeyHandlers(state);

  startAnimationLoop(state);
}

init();
