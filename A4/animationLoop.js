import { updatePhysics } from "./physics.js";
// import * as THREE from 'three';

const followLerp = 0.15;
const advanceThreshold = 1;
const positionThreshold = 1.5;

export function startAnimationLoop(state) {
    function animate() {
        requestAnimationFrame(() => animate());
        updatePhysics(state);
        state.updaters.forEach(fn => fn());

        // Update light uniforms
        const activeLights = [];
        if (state.lights.pointLight1.visible) activeLights.push(state.lights.pointLight1);
        if (state.lights.pointLight2.visible) activeLights.push(state.lights.pointLight2);
        if (state.lights.movingSpot.visible) activeLights.push(state.lights.movingSpot);

        // Pad arrays to ensure at least 3 elements
        const lightPositions = activeLights
            .map(light => light.position)
            .concat(Array(3).fill(new THREE.Vector3()))
            .slice(0, 3);

        const lightColors = activeLights
            .map(light => light.color)
            .concat(Array(3).fill(new THREE.Color(0, 0, 0)))
            .slice(0, 3);

        // Update shader materials
        state.dominoMeshes.forEach(mesh => {
            if (mesh.material instanceof THREE.ShaderMaterial) {
                mesh.material.uniforms.lightPositions.value = lightPositions;
                mesh.material.uniforms.lightColors.value = lightColors;
                mesh.material.uniforms.numLights.value = activeLights.length;

                // Safe ambient color handling
                if (state.lights.ambientColor instanceof THREE.Color) {
                    mesh.material.uniforms.ambientColor.value.copy(state.lights.ambientColor);
                } else {
                    mesh.material.uniforms.ambientColor.value.set(0.2, 0.2, 0.2);
                }
            }
        });

        // Camera follow logic
        const currentTarget = state.followTargets[state.followIndex] || state.ball.mesh;
        const nextTarget = state.followTargets[state.followIndex + 1];

        if (!currentTarget) {
            state.controls.update();
            state.renderer.render(state.scene, state.currentCamera);
            return;
        }

        const currentDesired = currentTarget.position.clone().add(state.currentCameraOffset);
        const nextDesired = nextTarget?.position.clone().add(state.currentCameraOffset);

        if (!state.isTransitioning) {
            state.followCamera.position.lerp(currentDesired, followLerp);
            state.followCamera.lookAt(currentTarget.position);

            if (nextTarget && shouldAdvanceCamera(currentTarget, currentDesired)) {
                startTransition(currentDesired, nextDesired);
            }

            state.lights.movingSpot.target.position.lerp(
                currentTarget.position,
                followLerp
            );
        } else {
            handleCameraTransition(currentTarget, nextTarget);
        }

        state.controls.update();
        state.renderer.render(state.scene, state.currentCamera);
    }

    function handleCameraTransition(currentTarget, nextTarget) {
        state.transitionProgress = Math.min(
            state.transitionProgress + followLerp,
            1
        );

        state.followCamera.position.lerpVectors(
            state.transitionStartPosition,
            state.transitionTargetPosition,
            state.transitionProgress
        );

        const lookAt = new THREE.Vector3().lerpVectors(
            currentTarget.position,
            nextTarget.position,
            state.transitionProgress
        );

        state.followCamera.lookAt(lookAt);
        state.lights.movingSpot.target.position.lerp(lookAt, followLerp);

        if (state.transitionProgress >= 0.999) {
            state.followIndex++;
            state.isTransitioning = false;
        }
    }

    function shouldAdvanceCamera(target, desired) {
        if (!state.ball || !target) return false;

        const body = target === state.ball.mesh
            ? state.ball.body
            : state.dominoBodies[state.followIndex - 1];

        return body &&
            body.velocity.length() < advanceThreshold &&
            state.followCamera.position.distanceTo(desired) < positionThreshold;
    }

    function startTransition(fromPos, toPos) {
        state.isTransitioning = true;
        state.transitionProgress = 0;
        state.transitionStartPosition.copy(state.followCamera.position);
        state.transitionTargetPosition.copy(toPos);
    }

    animate();
}