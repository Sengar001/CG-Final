export function setupWindowResize(camera, followCamera, renderer) {
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    followCamera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    followCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

export function setupKeyHandlers(state) {
  window.addEventListener("keydown", (e) => {
    switch (e.key.toLowerCase()) {
      case " ":
        if (!state.animationStarted && state.ball) {
          state.ball.body.wakeUp();
          state.ball.body.velocity.set(0, 0, -24);
          state.animationStarted = true;
        }
        break;
      case "1":
        state.currentCamera = state.camera;
        break;
      case "2":
        state.currentCamera = state.followCamera;
        break;
      case "3":
        state.lights.pointLight1.visible = !state.lights.pointLight1.visible;
        break;
      case "4":
        state.lights.pointLight2.visible = !state.lights.pointLight2.visible;
        break;
      case "5":
        state.lights.movingSpot.visible = !state.lights.movingSpot.visible;
        break;
      case "l":
        state.lights.pointLight1.visible = !state.lights.pointLight1.visible;
        state.lights.pointLight2.visible = !state.lights.pointLight2.visible;
        state.lights.movingSpot.visible = !state.lights.movingSpot.visible;
        break;
      case "arrowleft":
        if (state.currentCamera === state.followCamera) {
          state.cameraYAngle -= 0.1;
          state.currentCameraOffset
            .copy(state.baseCameraOffset)
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), state.cameraYAngle);
          e.preventDefault();
        }
        break;
      case "arrowright":
        if (state.currentCamera === state.followCamera) {
          state.cameraYAngle += 0.1;
          state.currentCameraOffset
            .copy(state.baseCameraOffset)
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), state.cameraYAngle);
          e.preventDefault();
        }
        break;
      case "r":
        location.reload();
        break;
    }
  });
}
